module.exports = {
  check_credentials: function(credentials) {
    // Check if login details have been provided.
    if (
      credentials.username == 'REPLACE_WITH_USERNAME' ||
      credentials.password == 'REPLACE_WITH_PASSWORD'
    ) {
      console.log(
        'You need to provide the login details for your 365datascience account.',
        '\nEdit the login details in the .env file.',
      );
      process.exit(1);
    }
  }
}
