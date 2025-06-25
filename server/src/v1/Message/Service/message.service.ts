// Nest dependencies
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

// Other dependencies
import { Validator } from 'class-validator'

// Local files
import { UsersRepository } from 'src/shared/Repositories/users.repository'
import { ConversationsRepository } from 'src/shared/Repositories/conversations.repository'
import { MessagesRepository } from 'src/shared/Repositories/messages.repository'
import { serializerService, ISerializeResponse } from 'src/shared/Services/serializer.service'
import { ConversationsEntity } from 'src/shared/Entities/conversations.entity'
import { StatusOk } from 'src/shared/Types'

@Injectable()
export class MessageService {

    private validator: Validator

    constructor(
        @InjectRepository(UsersRepository)
        private readonly usersRepository: UsersRepository,
        @InjectRepository(ConversationsRepository)
        private readonly conversationsRepository: ConversationsRepository,
        @InjectRepository(MessagesRepository)
        private readonly messagesRepository: MessagesRepository,
    ) {
        this.validator = new Validator()
    }

    async sendMessage({ recipient, body, from } : { recipient: string, body: string, from: string }): Promise<ConversationsEntity> {
        await this.usersRepository.findOneOrFail({ username: recipient })
        const conversation = await this.conversationsRepository.getConversationByParticipants(from, recipient)
            // tslint:disable-next-line:no-empty
            .catch(_error => {})
        if (conversation) {
            if (conversation.deleted_from.includes(recipient)) {
                conversation.deleted_from = conversation.deleted_from.filter(item => item !== recipient)
            } else if (conversation.deleted_from.includes(from)) {
                conversation.deleted_from = conversation.deleted_from.filter(item => item !== from)
            }

            await this.messagesRepository.createMessage({
                conversationId: String(conversation._id),
                sendBy: from,
                text: body
            })
                status: 'draft' // Default status
            })
            conversation.unread_messages[0].username === recipient ? conversation.unread_messages[0].value++
                : conversation.unread_messages[1].value++
            conversation.last_message_send_at = new Date()
            await this.conversationsRepository.save(conversation)
            return conversation
        } else {
            const newConversation = await this.conversationsRepository.createConversation([from, recipient])
            await this.messagesRepository.createMessage({
                conversationId: String(newConversation._id),
                sendBy: from,
                text: body
            })
                status: 'draft' // Default status
            })
            await this.conversationsRepository.increaseUnreadMessageCount(from, recipient)
            return newConversation
        }
    }

    async getConversationListByUsername (username: string, skip: string): Promise<ISerializeResponse>  {
        const result = await this.conversationsRepository.getConversationListByUsername(username, skip)
        return serializerService.serializeResponse('user_conversation_list', result)
    }

    async getUnreadMessageInfo (username: string): Promise<ISerializeResponse> {
        try {
            await this.usersRepository.findOneOrFail({ username })
        } catch (error) {
            throw new NotFoundException('User could not found by given username')
        }

        const [conversations] = await this.conversationsRepository.findAndCount({
            where: {
                participants: { $in: [username] },
                deleted_from: { $nin: [username] },
                $or: [
                    { 'unread_messages.0.username': username },
                    { 'unread_messages.1.username': username }
                ]
            }
        })

        const unReadValueWithConvId: { id: string, value: number }[] = conversations.map(conv => {
            const unReadMessageValue = conv.unread_messages[0].username === username ? conv.unread_messages[0].value : conv.unread_messages[1].value
            return {
                id: String(conv._id),
                value: unReadMessageValue
            }
        })

        const result = {
            values_by_conversations: unReadValueWithConvId,
            total_unread_value: unReadValueWithConvId.reduce((previous, current) => previous + current.value, 0)
        }

        return serializerService.serializeResponse('user_unread_message_info', result)
    }

    async getMessageListByConversationId (username: string, conversationId: string, skip: string): Promise<ISerializeResponse>  {
        if (!this.validator.isMongoId(conversationId)) throw new BadRequestException('Id must be a type of MongoId')
        await this.conversationsRepository.verifyUserAccessToConversation(username, conversationId)
        await this.conversationsRepository.resetUnreadMessageCount(username, conversationId)

        const result = await this.messagesRepository.getMessageListByConversationId(conversationId, skip)
        return serializerService.serializeResponse('conversation_message_list', result)
    }

    async deleteMessages(conversationId: string, username: string): Promise<StatusOk> {
        if (!this.validator.isMongoId(conversationId)) throw new BadRequestException('Id must be a type of MongoId')

        const isDeleted = await this.conversationsRepository.deleteConversation(conversationId, username)
        if (isDeleted) await this.messagesRepository.deleteMessagesBelongsToConversation(conversationId)

        return { status: 'ok', message: 'Messages successfully deleted' }
    }
}
