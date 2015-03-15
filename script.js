var ProductHunt = {
    addPost: function (post) {
        var el = $("<div></div>").addClass("post");
        var titleElement = $("<div></div>").text(post.name).addClass("title");
        var taglineElement = $("<div></div>").text(post.tagline).addClass("tagline");
        el.append(titleElement).append(taglineElement);

        el.on("click", function () {
            chrome.tabs.create({
                url: post["discussion_url"]
            });
        });

        $("#content").append(el);
    },
    addPosts: function (postsIds, posts, postsReadIds, postsRead) {
        $("#content").empty();
        if (postsIds.length > 0)
            $("#content").append($("<div></div>").text("Latest").addClass("group"));
        for (var i = 0; i < postsIds.length; i++) {
            this.addPost(posts[postsIds[i]]);
        }

        if (postsReadIds.length > 0)
            $("#content").append($("<div></div>").text("Today").addClass("group"));
        for (var i = 0; i < postsReadIds.length; i++) {
            this.addPost(postsRead[postsReadIds[i]]);
        }
    }

};

var Settings = {
    info: {},
    NotificationsSwitch: null,
    setSwitchery: function (switchElement, checkedBool) {
        if ((checkedBool && !switchElement.isChecked()) || (!checkedBool && switchElement.isChecked())) {
            switchElement.setPosition(true);
            switchElement.handleOnchange(true);
        }
    },
    buildSettings: function (client) {
        $("#hamburgerBtn").on("click", function () {
            $("#popup").toggle();
        });



        var elem = document.querySelector('#enableNotificationsSwitch');
        elem.checked = client.Settings.enableNotifications;
        Settings.NotificationsSwitch = new Switchery(elem, {
            size: 'small'
        });

        elem.onchange = function () {
            chrome.runtime.sendMessage({
                message: "enableNotifications",
                enableNotifications:elem.checked
            }, function () {
                
            });
        };

    }
};



jQuery(document).ready(function () {
    chrome.runtime.sendMessage({
        message: "popupLoaded"
    }, function (client) {
        Settings.buildSettings(client);
        ProductHunt.addPosts(client.PostsUnreadIds, client.PostsUnreadFull, client.PostsReadIds, client.PostsReadFull);
    });
});
