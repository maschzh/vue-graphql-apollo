const { ApolloServer, AuthenticationError } = require("apollo-server");
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const filePath = path.join(__dirname, 'typeDefs.gql');
const typeDefs = fs.readFileSync(filePath, 'utf-8');
const resolvers = require('./resolvers');

const User = require('./models/User');
const Post = require('./models/Post');
/**
 * Connect to MongoDB
 * @type {string}
 */
const uri = process.env.MONGO_CONNECTION;
mongoose.connect(uri, { useNewUrlParser: true })
  .then(() => {
    console.log('Connected to db');
  })
  .catch(() => {
    console.log('Error while connecting to DB');
  });

/**
 * Remove deprecation warning without indexes
 * https://github.com/Automattic/mongoose/issues/6890
 */
mongoose.set('useCreateIndex', true);

// Verify JWT Token passed from client
const getUser = async token => {
  if (token) {
    try {
      return await jwt.verify(token, process.env.JWT_SALT);
    } catch (err) {
      throw new AuthenticationError(
        "Your Session is invalid. Please log in again."
      );
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    return { name: error.name, message: error.message }
  },
  context: async ({ req }) => {
    const token = req.headers['authorization'];
    return { User, Post, currentUser: await getUser(token) };
  }
});


server.listen().then(({ url }) => {
  console.log(`Server listening on ${ url }`);
});
