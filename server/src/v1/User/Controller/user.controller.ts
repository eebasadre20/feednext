// Nest dependencies
import {
    BadRequestException,
    Controller,
    UseGuards,
    Get,
    Post,
    Patch,
    Put,
    Param,
    Body,
    Headers,
    Query,
    Res,
    Req,
    Delete
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'

// Other dependencies
import { RateLimit } from 'nestjs-rate-limiter'
import * as concat from 'concat-stream'

// Local files
import { jwtManipulationService } from 'src/shared/Services/jwt.manipulation.service'
import { UserService } from '../Service/user.service'
import { UpdateUserDto } from '../Dto/update-user.dto'
import { ActivateUserDto } from '../Dto/activate-user.dto'
import { ISerializeResponse } from 'src/shared/Services/serializer.service'
import { Roles } from 'src/shared/Decorators/roles.decorator'
import { Role } from 'src/shared/Enums/Roles'
import { UserBanDto } from '../Dto/user-ban.dto'
import { StatusOk } from 'src/shared/Types'

@ApiTags('v1/user')
@Controller()
export class UsersController {
    constructor(private readonly usersService: UserService) {}

    @Get(':username')
    getUser(@Param('username') username): Promise<ISerializeResponse> {
        return this.usersService.getUser(username)
    }

    @Get('search')
    searchUserByUsername(@Query('searchValue') searchValue: string): Promise<ISerializeResponse> {
        return this.usersService.searchUserByUsername({ searchValue })
    }

    @Get(':username/votes')
    getVotes(
        @Param('username') username,
        @Query() query: {
            skip: number,
            voteType: 'up' | 'down'
        },
    ): Promise<ISerializeResponse> {
        return this.usersService.getVotes({username, query})
    }

    @Get('pp')
    async getProfileImage(@Query('username') username,  @Res() res: any): Promise<void> {
        const buffer = await this.usersService.getProfileImageBuffer(username)
        res.type('image/jpeg').send(buffer)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @RateLimit({
        points: 3,
        duration: 60,
        errorMessage: 'You have reached the limit. You have to wait 60 seconds before trying again'
    })
    @Put('pp')
    @Roles(Role.User)
    uploadProfileImage(@Headers('authorization') bearer: string, @Req() req): Promise<StatusOk> {
        const username = jwtManipulationService.decodeJwtToken(bearer, 'username')

        return new Promise((resolve, reject) => {
            const handler = (_field, file, _filename, _encoding, mimetype) => {
                if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') reject(new BadRequestException('File must be image'))
                file.pipe(concat(buffer => {
                    this.usersService.uploadProfileImage(username, buffer)
                        .catch(error => reject(error))
                }))
            }

            req.multipart(handler, (error) => {
                if (error) reject(new BadRequestException('Not valid multipart request'))
                resolve({ status: 'ok', message: 'Upload successfully ended' })
            })
        })
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete('pp')
    @Roles(Role.User)
    deleteProfileImage(@Headers('authorization') bearer: string): StatusOk {
        this.usersService.deleteProfileImage(jwtManipulationService.decodeJwtToken(bearer, 'username'))
        return { status: 'ok', message: 'Image successfully deleted' }
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @RateLimit({
        points: 10,
        duration: 60,
        errorMessage: 'You have reached the limit. You have to wait 60 seconds before trying again'
    })
    @Patch('update')
    @Roles(Role.User)
    updateUser(
        @Body() dto: UpdateUserDto,
        @Headers('authorization') bearer: string,
    ): Promise<ISerializeResponse> {
        return this.usersService.updateUser(jwtManipulationService.decodeJwtToken(bearer, 'username'), dto)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch('ban-situation/:username')
    @Roles(Role.Admin)
    banOrUnbanUser(
        @Param('username') username,
        @Headers('authorization') bearer: string,
        @Body() dto: UserBanDto
    ): Promise<StatusOk> {
        return this.usersService.banOrUnbanUser(
            jwtManipulationService.decodeJwtToken(bearer, 'role'),
            username,
            dto.banSituation
        )
    }

    @RateLimit({
        points: 3,
        duration: 300,
        errorMessage: 'You have reached the limit. You have to wait 5 minutes before trying again'
    })
    @Get('verify-updated-email')
    async verifyUpdatedEmail(@Query('token') token: string): Promise<StatusOk> {
        return this.usersService.verifyUpdatedEmail(token)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch('disable')
    @Roles(Role.User)
    disableUser(
        @Headers('authorization') bearer: string,
    ): Promise<StatusOk> {
        return this.usersService.disableUser(jwtManipulationService.decodeJwtToken(bearer, 'username'))
    }

    @RateLimit({
        points: 1,
        duration: 300,
        errorMessage: 'You can only send 1 activation mail in 5 minutes'
    })
    @Post('send-activation-mail')
    async sendActivationMail(@Body() dto: ActivateUserDto): Promise<StatusOk > {
        return this.usersService.sendActivationMail(dto)
    }

    @RateLimit({
        points: 3,
        duration: 300,
        errorMessage: 'You have reached the limit. You have to wait 5 minutes before trying again'
    })
    @Get('activate-user')
    async activateUser(@Query('token') token: string): Promise<StatusOk> {
        return this.usersService.activateUser(token)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('follow/:followedId')
    async followUser(
        @Headers('authorization') bearer: string,
        @Param('followedId') followedId: string
    ): Promise<StatusOk> {
        const followerId = jwtManipulationService.decodeJwtToken(bearer, 'id');
        await this.usersService.followUser(followerId, followedId);
        return { status: 'ok', message: 'User followed successfully' };
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete('unfollow/:followedId')
    async unfollowUser(
        @Headers('authorization') bearer: string,
        @Param('followedId') followedId: string
    ): Promise<StatusOk> {
        const followerId = jwtManipulationService.decodeJwtToken(bearer, 'id');
        await this.usersService.unfollowUser(followerId, followedId);
        return { status: 'ok', message: 'User unfollowed successfully' };
    }

    @Get(':username/followers')
    async getFollowers(@Param('username') username: string): Promise<ISerializeResponse> {
        const user = await this.usersService.getUser(username);
        return this.usersService.getFollowers(user.id);
    }

}
