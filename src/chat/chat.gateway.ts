import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ChatService } from './chat.service';

import { UpdateChatDto } from './dto/update-chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
})
export class ChatGateway {
  constructor(private readonly chatService: ChatService) { }

  
}
