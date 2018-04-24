const isLoggedIn = ctx => {
    const user = ctx.request.user;
    if (!user) throw new Error(`Not logged in`);
    return user;
};

const ctxUser = ctx => _get(ctx, userLocationOnContext);

const directiveResolvers = {
    isAuthenticated: (next, source, args, ctx) => {
        isLoggedIn(ctx);
        return next();
    },
};

module.exports = { directiveResolvers };