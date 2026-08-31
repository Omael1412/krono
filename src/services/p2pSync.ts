// src/services/p2pSync.ts
// Servicio de sincronización P2P para cola de reproducción en red local.
// Arquitectura WebRTC preparada — activa al conectar un servidor de señalización.
//
// PARA ACTIVAR: iniciar un servidor de señalización (ej. socket.io) y
// descomentar las llamadas a `initSignaling()`.

export type P2PMessage =
  | { type: 'SYNC_QUEUE'; payload: { trackIds: string[]; currentIndex: number } }
  | { type: 'PLAY'; payload: { currentTime: number } }
  | { type: 'PAUSE' }
  | { type: 'SEEK'; payload: { currentTime: number } }
  | { type: 'PEER_JOIN'; payload: { peerId: string } };

export type P2PMessageHandler = (msg: P2PMessage) => void;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

class P2PSyncService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private onMessage: P2PMessageHandler | null = null;
  public isConnected = false;

  /** Inicializa la conexión WebRTC como host (oferta) */
  async startAsHost(): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.dataChannel = this.peerConnection.createDataChannel('krono-sync');
    this.setupDataChannel(this.dataChannel);

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /** Se conecta como cliente recibiendo la oferta del host */
  async joinAsClient(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peerConnection.ondatachannel = (e) => {
      this.dataChannel = e.channel;
      this.setupDataChannel(this.dataChannel);
    };
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /** Completa el handshake del host con la respuesta del cliente */
  async completeHandshake(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.peerConnection?.setRemoteDescription(answer);
  }

  /** Envía un mensaje a todos los peers conectados */
  send(msg: P2PMessage): void {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(msg));
    }
  }

  /** Registra el handler de mensajes entrantes */
  setMessageHandler(handler: P2PMessageHandler): void {
    this.onMessage = handler;
  }

  /** Cierra la conexión */
  disconnect(): void {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.peerConnection = null;
    this.dataChannel = null;
    this.isConnected = false;
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.isConnected = true;
      console.log('[P2PSync] DataChannel abierto');
    };
    channel.onclose = () => {
      this.isConnected = false;
      console.log('[P2PSync] DataChannel cerrado');
    };
    channel.onmessage = (e) => {
      try {
        const msg: P2PMessage = JSON.parse(e.data as string);
        this.onMessage?.(msg);
      } catch {
        console.warn('[P2PSync] Mensaje malformado:', e.data);
      }
    };
  }
}

// Singleton exportado
export const p2pSync = new P2PSyncService();
