// Bitbucket Connect also supports a client side library - AP (for "Atlassian Plugins") - that
// allows you to interact with the host application. For example, you can make authenticated
// requests to the Bitbucket REST API ...

AP.require('request', function(request) {
    request({
        url: '/1.0/user/',
        success: function(data) {
            $('#displayName')
                .text(data.user.display_name)
                .next('.loading').hide();
        }
    });
});
