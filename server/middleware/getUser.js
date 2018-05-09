async function createPrismaUser(db, idToken) {
    console.log('in create user id: ', idToken);
    
    const user = await db.mutation.createUser({
      data: {
        auth0Id: idToken.sub.split(`|`)[1],
        email: idToken.email,
      }
    });

    return user;
};

const getUser = async (req, res, next, db) => {
    if (!req.user) return next();
    let user = await db.query.user({ where: { auth0Id: req.user.sub.split(`|`)[1] } });

    console.log('query data is ...', user);
    
    try {
        if (!user) {
            user = await createPrismaUser(db, req.user);
        }
    } catch (err) {
        throw new Error(err.message);
    }
    

    req.user = { ...user, token: req.user };
    console.log('Request is now: ', JSON.stringify(req.user));
    next();
};
  
module.exports = { getUser };