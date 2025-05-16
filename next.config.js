module.exports = {
    compiler: {
        // Remove console logs only in production
        removeConsole: process.env.NODE_ENV === "production"
    }
};