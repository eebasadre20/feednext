// Nest dependencies
import { Entity, Column, ObjectID, ObjectIdColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Local files
import { UsersEntity } from './users.entity';

@Entity('Followers')
export class FollowersEntity {
    @ObjectIdColumn()
    id: ObjectID;

    @Column(type => UsersEntity)
    follower: UsersEntity;

    @Column(type => UsersEntity)
    followed: UsersEntity;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
