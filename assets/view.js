CTFd._internal.challenge.data = undefined;

// TODO: Remove in CTFd v4.0
CTFd._internal.challenge.renderer = null;

CTFd._internal.challenge.preRender = function() {};

// TODO: Remove in CTFd v4.0
CTFd._internal.challenge.render = null;

CTFd._internal.challenge.postRender = function() {};

CTFd._internal.challenge.submit = function(preview) {
  var challenge_id = parseInt(CTFd.lib.$("#challenge-id").val());
  var submission = CTFd.lib.$("#challenge-input").val();

  var body = {
    challenge_id: challenge_id,
    submission: submission
  };
  var params = {};
  if (preview) {
    params["preview"] = true;
  }

  return CTFd.api.post_challenge_attempt(params, body).then(function(response) {
    if (response.status === 429) {
      // User was ratelimited but process response
      return response;
    }
    if (response.status === 403) {
      // User is not logged in or CTF is paused.
      return response;
    }
    return response;
  });
};


function toggleLoading(btn) {
    var icon = btn.querySelector('i');
    btn.disabled = !btn.disabled;
    icon.classList.toggle('fa-spin');
    icon.classList.toggle('fa-spinner');
}

function resetAlert() {
    let alert = $(".deployment-actions > .alert").first();
    alert.empty();
    alert.removeClass("alert-danger");
    return alert;
}

function toggleChallengeCreate() {
    let btn = $(".create-chal").first();
    btn.toggleClass('d-none');
}

function toggleChallengeUpdate() {
    let btn = $(".extend-chal").first();
    btn.toggleClass('d-none');

    btn = $(".terminate-chal").first();
    btn.toggleClass('d-none');
}

function calculateExpiry(date) {
    // Get the difference in minutes
    let difference = Math.floor((date - Date.now()) / (1000 * 60));
    return difference;
}

function createChallengeLinkElement(data, parent) {
    let expiry = calculateExpiry(new Date(data.deployment.expires));

    if (expiry > 0) {
        var expires = document.createElement('span');
        expires.textContent = "Expires in " + calculateExpiry(new Date(data.deployment.expires)) + " minutes.";

        // TODO: remove this jank and have a proper way to determine how to connect to chals
        parent.append(expires);
        parent.append(document.createElement('br'));
        if (data.deployment.host.includes("pwn")) {
            var conn_string = document.createElement('span');
            conn_string.textContent = `openssl s_client -quiet -connect ${data.deployment.host}:443`
            parent.append(conn_string);

        } else {
            let link = document.createElement('a');
            link.href = 'https://' + data.deployment.host;
            link.textContent = data.deployment.host;
            link.target = '_blank'
            parent.append(link);
        }

        // Add admin bot link if challenge is tagged with bot
        const chalTag = CTFd.lib.$(".challenge-tag").last().text();
        if (chalTag == "bot") {
            parent.append(document.createElement("br"))
            let link = document.createElement('a');
            const subdomains = new URL(`https://${data.deployment.host}`).hostname.split('.')
            const unique = `${subdomains.shift(1)}-bot`;
            const host = `https://${unique}.${subdomains.join('.')}`
            link.href =  host;
            link.target = '_blank'
            link.textContent = "Admin Bot";
            parent.append(link);
        }
        
    } 
}

function awaitChallengeReady(data) {
    
}

function getDeployment(deployment) {
    let alert = resetAlert();

    $.ajax({
        type: "GET",
        url: "api/kube_ctf/" + deployment,
        success: function(data) {

            createChallengeLinkElement(data, alert);
            toggleChallengeUpdate();
        },
        error: function(error) {
            alert.append("Challenge not started")
            toggleChallengeCreate();
        }
    }) 
}

function createDeployment(btn) {
    let deployment = btn.dataset.deployment;
    toggleLoading(btn);
    let alert = resetAlert();

    // Can't use the nice format cause need to put content-type header in
    $.ajax({
        type: "POST",
        url: "api/kube_ctf/" + deployment,
        data: JSON.stringify({action: "create"}),
        contentType: "application/json",
        success: function(data) {
	    createChallengeLinkElement(data, alert);
	    toggleChallengeUpdate();
	    toggleChallengeCreate();
	    toggleLoading(btn);
        },
        error: function(error) {
            alert.append(error.responseJSON.error || error.responseJSON.message)
            alert.addClass("alert-danger")
            toggleLoading(btn);
        }
    }) 
}

function extendDeployment(btn) {
    let deployment = btn.dataset.deployment;
    toggleLoading(btn);
    let alert = resetAlert();

    // Can't use the nice format cause need to put content-type header in
    $.ajax({
        type: "POST",
        url: "api/kube_ctf/" + deployment,
        data: JSON.stringify({action: "extend"}),
        contentType: "application/json",
        success: function(data) {
            createChallengeLinkElement(data, alert)
            toggleLoading(btn);
        },
        error: function(error) {
            alert.append(error.responseJSON.error || error.responseJSON.message)
            alert.addClass("alert-danger")
            toggleLoading(btn);
        }
    })    

}

// function resetDeployment() {

// }

function terminateDeployment(btn) {
    let deployment = btn.dataset.deployment;
    toggleLoading(btn);
    let alert = resetAlert();

    // Can't use the nice format cause need to put content-type header in
    $.ajax({
        type: "POST",
        url: "api/kube_ctf/" + deployment,
        data: JSON.stringify({action: "terminate"}),
        contentType: "application/json",
        success: function(data) {
            alert.append("Challenge Terminated.")
            toggleChallengeCreate();
            toggleChallengeUpdate();
            toggleLoading(btn);
        },
        error: function(error) {
            alert.append(error.responseJSON.error || error.responseJSON.message)
            alert.addClass("alert-danger")
            toggleLoading(btn);
        }
    })
}
