import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  // In rder to add a new listener, create an entry here
  // listeners: Map<string, Map<string, (object: Object) => void>> = new Map([
  //   ['offer', new Map()],
  //   ['answer', new Map()],
  // ]);
  constructor(public socket: Socket) {
    // Iterate listeners and prep for callback functions
    // [...this.listeners.keys()].forEach((key) => {
    //   socket.on(key, (object: Object) => {
    //     console.log('LISTENER AUTOMIZER', `@event:${key}`);
    //     this.listeners.get(key)?.forEach((callback) => {
    //       callback(object);
    //     });
    //   });
    // });
  }

  // Listener callback register
  // on(event: string, c: (object: any) => void, key: string): void {
  //   if (this.listeners.has(event)) this.listeners.get(event)?.set(key, c);
  //   else console.error(`"${event}" is not a registered listener event!`);
  // }

  // Listener callback remover
  // off(event: string, key: string): void {
  //   if (this.listeners.has(event)) this.listeners.get(event)?.delete(key);
  // }

  invitePeer(id: string) {
    this.socket.emit('peer', id);
    console.log('PEER KEY FIRED TO', id);
  }

  respondPeer(id: string) {
    this.socket.emit('peer', id, true);
    console.log('PEER KEY FIRED TO', id);
  }
}
