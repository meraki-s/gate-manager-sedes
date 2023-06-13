
class UserMessage {
    messageErrorsIsAdmin(error) {
        return {
            ok: false,
            msg: 'Denied access.',
            error
        }
    }

    messageErrorsPostUser(error) {
        return {
            ok: false,
            msg: 'Could not create user.',
            error
        }
    }

    messageSuccessPostUser() {
        return {
            ok: true,
            msg: 'User created successfully.'
        }
    }

    messageSuccessPostRegisterUser() {
        return {
            ok: true,
            msg: 'User created successfully.'
        }
    }
}

module.exports = UserMessage;
