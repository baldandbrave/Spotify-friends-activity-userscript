// ==UserScript==
// @name         Spotify Friends Activity
// @description  A messy snippet to show Friends Activity on open.spotify.com
// @version      0.0.1
// @author       baldandbrave https://github.com/baldandbrave
// @supportURL   https://github.com/baldandbrave/spotify_friends_activity_userscript/issues
// @match        https://open.spotify.com/*
// @connect      spclient.wg.spotify.com
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(async function () {
    'use strict';
    let tokenRequest = new Promise(resolve => {
        GM.xmlHttpRequest(
            {
                method: 'GET',
                url: 'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
                headers: {
                    'Cookie': document.cookie,
                    'User-Agent': navigator.userAgent
                },
                onload: (res) => {
                    // accessToken = JSON.parse(res.responseText).accessToken;
                    // Promise.resolve(JSON.parse(res.responseText).accessToken);
                    resolve(JSON.parse(res.responseText).accessToken);
                }
            }
        );
    });

    let accessToken = await tokenRequest;

    // idea from https://github.com/spotify/web-api/issues/83#issuecomment-573150153
    let friendListRequest = new Promise(resolve => {
        GM.xmlHttpRequest(
            {
                method: 'GET',
                url: 'https://spclient.wg.spotify.com/presence-view/v1/buddylist',
                headers: {
                    Authorization: 'Bearer ' + accessToken,
                },
                onload: (res) => {
                    // friendListData = JSON.parse(res.responseText).friends;
                    resolve(JSON.parse(res.responseText).friends);
                }
            }
        );
    });
    let friendListData = await friendListRequest;

    let innerHTML = '';
    let friendListHeader = `
  <span class="connect-device-picker">
      <div class="connect-device-list-container" style="width: 700px;">
          <div class="connect-device-list-content">
              <div class="connect-title" style="text-align: left;">
                  <h3 class="connect-title__text" tabindex="-1">Friends Activity</h3>
              </div>`
    innerHTML += friendListHeader;

    friendListData.forEach(element => {
        let userid = element.user.uri.split(':').pop();
        let username = element.user.name;
        let trackID = element.track.uri.split(':').pop();
        let trackName = element.track.name;
        // single/multiple artists cases
        let artistID = element.track.artist.uri.split(':').pop();
        let artistName = element.track.artist.name;
        let albumID = element.track.album.uri.split(':').pop();
        let albumName = element.track.album.name;
        let hoursAgo = Math.floor((Date.now() - element.timestamp) / 36e5)

        let userNameDiv = `
      <!-- removable or display avatar and username -->
      <!-- for h4 username, maybe add href -->
      <div class="connect-header" style="padding: 0px 27px; font-size: 18px; color: #fff; text-align: left; display: flex;">
        <h4><a href="/user/${userid}">${username}</a></h4><h5>&nbsp;&nbsp;&nbsp;&nbsp;${hoursAgo}&nbsp;hours ago</h5>
      </div>`
        innerHTML += userNameDiv;
        let trackDiv = `
      <div class="connect-info" style="padding: 10px 15px;">
        <li class="tracklist-row" role="button" tabindex="0" data-testid="tracklist-row">
            <div class="tracklist-col position-outer">
                <!-- here is the play-pause event listener -->
                <div class="tracklist-play-pause tracklist-top-align"><svg class="icon-play"
                        viewBox="0 0 85 100">
                        <path fill="currentColor"
                            d="M81 44.6c5 3 5 7.8 0 10.8L9 98.7c-5 3-9 .7-9-5V6.3c0-5.7 4-8 9-5l72 43.3z">
                            <title>PLAY</title>
                        </path>
                    </svg></div>
                <!-- add ::before when not moved on and delete when moved on-->
                <div class="position tracklist-top-align"><span class="spoticon-track-16"></span></div>
            </div>
            <div class="tracklist-col name">
                <div class="track-name-wrapper tracklist-top-align">
                    <div class="tracklist-name ellipsis-one-line" dir="auto" style="text-align: left;"><a href="/track/${trackID}">${trackName}</a></div>
                    <div class="second-line">
                        <span class="TrackListRow__artists ellipsis-one-line" dir="auto">
                            <span class="react-contextmenu-wrapper"><span draggable="true"><a
                                        tabindex="-1" class="tracklist-row__artist-name-link"
                                        href="/artist/${artistID}">${artistName}</a></span></span>
                        </span>
                        <span class="second-line-separator" aria-label="in album">•</span>
                        <span class="TrackListRow__album ellipsis-one-line" dir="auto"><span
                                class="react-contextmenu-wrapper"><span draggable="true"><a
                                        tabindex="-1" class="tracklist-row__album-name-link"
                                        href="/album/${albumID}">${albumName}</a></span></span></span>
                    </div>
                </div>
            </div>
            <div class="tracklist-col more" style="padding-right: 0px;">
                <div class="tracklist-top-align">
                    <div class="react-contextmenu-wrapper">
                        <!-- here is the more button listener -->
                        <button
                            class="_2221af4e93029bedeab751d04fab4b8b-scss c74a35c3aba27d72ee478f390f5d8c16-scss"
                            type="button">
                            <div class="spoticon-ellipsis-16"></div>
                        </button></div>
                </div>
            </div>
        </li>
      </div>
    `
        innerHTML += trackDiv;
    });
    let freindListButton = `
  </div>
  </div>
  <!-- add before in button, add popup eventlistener-->
  <!-- spotify-devices-16 controls the button svg, add svg finally -->
  <button class="spoticon-devices-16 control-button" aria-label="Connect to a device" id="friendListButton"></button>
  </span>
  `
    innerHTML += freindListButton;
    setTimeout(() => {
        let extraControl = document.querySelector('.ExtraControls');
        let friendListWrapper = document.createElement('div');
        friendListWrapper.classList.add('ExtraControls__connect-device-picker');
        friendListWrapper.innerHTML = innerHTML;
        extraControl.prepend(friendListWrapper);
        let buttonInDom = document.querySelector('#friendListButton');
        buttonInDom.addEventListener('click', () => { document.querySelector('div.connect-device-list-container').classList.add('connect-device-list-container--is-visible') });
        buttonInDom.addEventListener('focusout', () => { document.querySelector('div.connect-device-list-container').classList.remove('connect-device-list-container--is-visible') });
        let nowPlayingBarRightInner = document.querySelector("div.now-playing-bar__right__inner");
        nowPlayingBarRightInner.style.width = 'auto';
    }, 2000);
})();
