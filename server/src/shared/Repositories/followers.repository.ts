// Nest dependencies
import { EntityRepository, Repository } from 'typeorm';

// Local files
import { FollowersEntity } from '../Entities/followers.entity';

@EntityRepository(FollowersEntity)
export class FollowersRepository extends Repository<FollowersEntity> {
    async followUser(followerId: string, followedId: string): Promise<void> {
        const follower = new FollowersEntity();
        follower.follower = { id: followerId } as any;
        follower.followed = { id: followedId } as any;
        await this.save(follower);
    }

    async unfollowUser(followerId: string, followedId: string): Promise<void> {
        await this.delete({ follower: { id: followerId }, followed: { id: followedId } });
    }

    async getFollowers(userId: string): Promise<FollowersEntity[]> {
        return this.find({ where: { followed: { id: userId } } });
    }
}
