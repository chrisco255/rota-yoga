const { GraphQLServer } = require('graphql-yoga');

const Query = {
    hello: () => 'Hello world',
};

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers: {
        Query
    },
});

server.start(() => console.log('Server is running at localhost:4000'));