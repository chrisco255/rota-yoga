require('dotenv').config();
const { GraphQLServer } = require('graphql-yoga');
const { formatError } = require('apollo-errors');
const { makeExecutableSchema } = require('graphql-tools');
const { importSchema } = require('graphql-import');
const { Prisma, extractFragmentReplacements, forwardTo } = require("prisma-binding")
const cors = require('cors');

const { checkJwt } = require('./server/middleware/jwt');
const { getUser } = require('./server/middleware/getUser');
const { directiveResolvers } = require('./server/directives');
const getStorageAccessSignature = require('./server/resolvers/queries/getStorageAccessSignature');
const uuid = require('uuid');

const ctxUser = ctx => ctx.request.user;

const resolvers = {
    Query: {
        hello: (parent, args, context, info) => {
            console.log('Hello context', JSON.stringify(context.request.user));
            const userToken = context.request.user.token;
    
            console.log(JSON.stringify('In the hello resolver', userToken));
    
            const auth0Token = userToken.sub.split("|")[1];

            console.log('user email is ', context.request.user.email);
            console.log('user is...', JSON.stringify(context.request.user));
            
            return context.request.user;
        },
        world: () => "An unauthenticated resolver",
        userInfo: (parent, args, context, info) => {
            return context.request.user;
        },
        getStorageAccessSignature
    },
    Mutation: {
        async onboardUser(parent, { name }, ctx, info) {
            const { id } = ctxUser(ctx);

            return ctx.db.mutation.updateUser(
                {
                    where: { id },
                    data: { displayName: name, onboardingComplete: true },
                },
                info
            );
        },
        async createClip(parent, args, ctx, info) {
            const clipId = uuid.v4();
            const userId = ctxUser(ctx).id;

            const clip = await ctx.db.mutation.createClip(
                {
                    data: {
                        clipId,
                        author: {
                            connect: {
                                id: userId,
                            },
                        },
                    },
                },
                info
            );

            //console.log('queryResolvers: ', JSON.stringify(queryResolvers))

            const sharedAccessSignature = getStorageAccessSignature(parent, args, ctx, info);

            return {
                sharedAccessSignature,
                clipId
            };
        },
    },
};

const db = new Prisma({
    fragmentReplacements: extractFragmentReplacements(resolvers),
    typeDefs: "database/generated/prisma.graphql",
    endpoint: process.env.PRISMA_ENDPOINT,
    secret: process.env.PRISMA_SECRET,
    debug: true
});

const schema = makeExecutableSchema({
    typeDefs: importSchema('./server/schema.graphql'),
    resolvers,
    directiveResolvers,
});

const server = new GraphQLServer({
    schema,
    context: req => ({
        db,
        ...req,
    }),
});

server.express.use(cors());

server.express.post(
    server.options.endpoint,
    checkJwt,
    (err, req, res, next) => {
        if(err) return res.status(200).send({ data: [], errors: [{ message: err.message }] });
        next();
    },
);

server.express.post(server.options.endpoint, (req, res, next) =>
    getUser(req, res, next, db)
);

server.start({ formatError }, () => console.log('Server is running at localhost:4000'));