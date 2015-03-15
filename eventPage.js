var ProductHuntClient = {
    Posts: {},
    PostsIds: [],
    PostsLatestIds: [],
    PostsOldIds: [],
    PostsUnreadIds: [],
    PostsReadIds: [],
    PostsUnreadFull: {},
    PostsReadFull: {},
    PostsAreRead: false,
    Settings: {
        enableNotifications: true
    },
    getTodayPosts: function () {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.producthunt.com/v1/posts", true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer f18403286877315ce9f5992ba859cd8d02c484d3f579a7f043ae9c35fbaed531");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                var resp = JSON.parse(xhr.responseText);
                ProductHuntClient.requestComplete(resp);
            }
        };
        xhr.send();
    },
    requestComplete: function (response) {
        ProductHuntClient.Posts = {};
        ProductHuntClient.PostsIds = [];

        var posts = response.posts;

        for (var i = 0; i < posts.length; i++) {
            ProductHuntClient.PostsIds.push(posts[i].id);
            ProductHuntClient.Posts[posts[i].id] = posts[i];
        }

        ProductHuntClient.PostsLatestIds = ProductHuntClient.difference(ProductHuntClient.PostsIds, ProductHuntClient.PostsOldIds);

        if (ProductHuntClient.PostsLatestIds.length > 0) {
            if (this.PostsAreRead === true) {
                this.PostsUnreadIds = [];
                this.PostsUnreadFull = {};
                this.PostsReadIds = [];
                this.PostsReadFull = {};
            }
        }

        ProductHuntClient.PostsOldIds = ProductHuntClient.concatUnique(ProductHuntClient.PostsOldIds, ProductHuntClient.PostsLatestIds);

        ProductHuntClient.PostsUnreadIds = ProductHuntClient.concatUnique(ProductHuntClient.PostsUnreadIds, ProductHuntClient.PostsLatestIds);
        ProductHuntClient.PostsReadIds = ProductHuntClient.difference(ProductHuntClient.PostsIds, ProductHuntClient.PostsUnreadIds);


        for (i = 0; i < ProductHuntClient.PostsLatestIds.length; i++) {
            ProductHuntClient.PostsUnreadFull[ProductHuntClient.PostsLatestIds[i]] = ProductHuntClient.Posts[ProductHuntClient.PostsLatestIds[i]];
        }

        for (i = 0; i < ProductHuntClient.PostsReadIds.length; i++) {
            ProductHuntClient.PostsReadFull[ProductHuntClient.PostsReadIds[i]] = ProductHuntClient.Posts[ProductHuntClient.PostsReadIds[i]];
        }

        if (ProductHuntClient.PostsLatestIds.length > 0) {
            this.PostsAreRead = false;
            var latestPostID = ProductHuntClient.PostsLatestIds[ProductHuntClient.PostsLatestIds.length - 1];
            ProductHuntClient.sendNotification(ProductHuntClient.PostsUnreadFull[latestPostID], ProductHuntClient.PostsLatestIds.length);

            ProductHuntClient.updateBadge(ProductHuntClient.PostsUnreadIds.length);
        }
    },
    difference: function (foo, bar) {
        // calculate the difference between 2 arrays( PostsIds and PostsLatestIds)
        var baz = [];

        for (var i = 0; i < foo.length; i++) {
            var key = foo[i];
            if (-1 === bar.indexOf(key)) {
                baz.push(key);
            }
        }
        return baz;
    },
    concatUnique: function (a, b) {
        var c = a.concat(b.filter(function (item) {
            return a.indexOf(item) < 0;
        }));
        return c;
    },
    resetUnread: function () {
        this.PostsAreRead = true;
    },
    sendNotification: function (post, postNumber) {
        if (ProductHuntClient.Settings.enableNotifications === false)
            return;
        if (postNumber > 1) {
            chrome.notifications.create("huntnotication", {
                type: "basic",
                title: postNumber + " new posts",
                message: "",
                iconUrl: "icons/icon-64.png"
            }, function () {
            });
        } else {
            chrome.notifications.create("huntnotication", {
                type: "basic",
                title: post.name,
                message: post.tagline,
                iconUrl: "icons/icon-64.png"
            }, function () {
            });
        }
    },
    updateBadge: function (n) {
        n = n === 0 ? "" : n + "";
        chrome.browserAction.setBadgeText({
            text: n
        });
    },
    loadSettings: function () {
        chrome.storage.sync.get("enableNotifications", function (items) {
            if (items.enableNotifications == null) {
                chrome.storage.sync.set({
                    enableNotifications: ProductHuntClient.Settings.enableNotifications
                });
            } else {
                ProductHuntClient.Settings.enableNotifications = items.enableNotifications;
            }
        });
    }
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.message) {
        case "popupLoaded":
            ProductHuntClient.updateBadge(0);
            sendResponse(ProductHuntClient);
            ProductHuntClient.resetUnread();
            break;
        case "enableNotifications":
            chrome.storage.sync.set({
                enableNotifications: message.enableNotifications
            });
            ProductHuntClient.Settings.enableNotifications = message.enableNotifications;
            break;
    }
});


ProductHuntClient.loadSettings();
ProductHuntClient.getTodayPosts();


chrome.alarms.create("latestPosts", {
    periodInMinutes: 10
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    switch (alarm.name) {
        case "latestPosts":
            ProductHuntClient.getTodayPosts();
            break;
    }
});


