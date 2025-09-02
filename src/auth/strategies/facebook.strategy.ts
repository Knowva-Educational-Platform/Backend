import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_APP_ID!,
            clientSecret: process.env.FACEBOOK_APP_SECRET!,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
            profileFields: ['id', 'displayName', 'emails'],
            scope: ['email'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile) {
        return {
            provider: 'facebook',
            providerAccountId: profile.id,
            email: (profile as any).emails?.[0]?.value ?? null,
            name: profile.displayName,
            accessToken,
            refreshToken,
        };
    }
}
