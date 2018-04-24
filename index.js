const { GraphQLServer } = require('graphql-yoga');
const { checkJwt } = require("./src/middleware/jwt");
const { getUser } = require("./src/middleware/getUser");

const ctxUser = ctx => ctx.request.user;

const Query = {
    hello: (parent, args, context, info) => {
        console.log('Hello context', JSON.stringify(context.request.user));
        const userToken = context.request.user.token;

        console.log(JSON.stringify('In the hello resolver', userToken));

        const auth0Token = userToken.sub.split("|")[1]

        return auth0Token;
    },
};

const Mutation = {
    async authenticate(parent, { idToken }, ctx, info) {
        let userToken = null;
        try {
          userToken = await validateAndParseIdToken(idToken);
        } catch (err) {
          throw new Error(err.message)
        }
        const auth0id = userToken.sub.split("|")[1]
        
        return auth0id;
    },
};

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers: {
        Query,
        Mutation,
    },
    context: req => ({
        ...req,
    }),
});

server.express.post(
    server.options.endpoint,
    checkJwt,
    (err, req, res, next) => {
        if(err) return res.status(200).send({ data: [], errors: [{ message: err.message }] });
        next();
    },
);

server.express.post(server.options.endpoint, (req, res, next) =>
  getUser(req, res, next)
);

server.start(() => console.log('Server is running at localhost:4000'));