/* By Daniel in 2018 */

const perm_token = 'PUT YOUR TOKEN HERE';
const page_id = 'PUT PAGE ID HERE';
const review_maxlength = 600;

function formatDate(date) {
    let d = date.getDate();
    if (d < 10) {
        d = "0" + d;
    }
    let m = date.getMonth();
    m += 1;
    if (m < 10) {
        m = "0" + m;
    }
    let y = date.getFullYear();
    return d + "." + m + "." + y
}

function http_get(url) {
    return new Promise(function(resolve, reject) {
        let req = new XMLHttpRequest();
        req.open('GET', url);
        req.onload = function() {
            if (req.status === 200) {
                resolve(req.response);
            }
            else {
                reject(Error(req.statusText));
            }
        };
        req.onerror = function() {
            reject(Error("Network Error"));
        };
        req.send();
    });
}

function getRatingNumber(rating) {
    let rating_points = "";
    if (rating.hasOwnProperty("rating")) {
        switch (rating.rating) {
            case 4:
                rating_points = "four";
                break;
            case 5:
                rating_points = "five";
                break;
            default:
                return ""
        }
    }
    return rating_points
}

function getReviewerName(rating) {
    let reviewer = rating.reviewer;
    if (reviewer == undefined) {
        reviewer = "einem Gast";
    } else {
        reviewer = rating.reviewer.name;
        reviewer = reviewer.split(' ')[0] + ' ' + reviewer.split(' ')[1][0] + '.'
    }
    return reviewer;
}

async function get_reviews(url) {
    let response = await http_get(url);
    response.replace('\\u', '\\\\u');
    const json_rsp = JSON.parse(response);
    return json_rsp
}

function constructHtml(obj) {
    const data_array = obj.created_time.split("+");
    const review_date = formatDate(new Date(data_array[0]));
    const rev_tex = obj.review_text.replace(/\uFFFD/g, '');
    const rating_points = getRatingNumber(obj);
    const reviewer = getReviewerName(obj);

    let html = '';
    if(rating_points !== '') {
        html = `<div class="review"><p class="review_text"><i class="stars ${rating_points}"></i> von ${reviewer} am ${review_date}<br>${rev_tex}</p></div>`;
    } else {
        html = `<div class="review"><p class="review_text"><i class="_51mq img sp_KcIon78B9es sx_5341ff"></i>Empfohlen von ${reviewer} am ${review_date}<br>${rev_tex}</p></div>`;
    }

    return html;
}

async function load_overall_ratings() {
    const url = `https://graph.facebook.com/v3.1/me?access_token=${perm_token}&debug=all&fields=id%2Cname%2Coverall_star_rating%2Crating_count&format=json&method=get&pretty=0&suppress_http_code=1`;
    let data = await http_get(url);
    appendOverallStarRating(JSON.parse(data));
}

function appendOverallStarRating(data) {
    let html = '<div id="overall_rating">' + data.overall_star_rating + '</div>';
    html += '<div class="rating_container"><div class="mvm uiP fsm">' + data.overall_star_rating + ' von 5 Sternen</div><div class="lines_rating">' + data.rating_count + ' Bewertungen</div></div>';
    document.getElementById("ovr_container").innerHTML = html;
}

function show_reviews(nr) {
    const url = `https://graph.facebook.com/v3.1/${page_id}/?access_token=${perm_token}&debug=all&fields=ratings&format=json&method=get&pretty=0&suppress_http_code=1`;

    get_reviews(url).then(function(data) {
        console.log(data);
        let ratings = data.ratings.data;
        ratings = ratings.filter(v => v.hasOwnProperty("recommendation_type") && v.recommendation_type === 'positive');
        ratings = ratings.filter(v => v.hasOwnProperty("review_text") && v.review_text.length < review_maxlength);
        ratings = ratings.filter(v => (v.hasOwnProperty("rating") && v.rating >= 4) || !v.hasOwnProperty("rating"));
        ratings = ratings.slice(0, nr);

        const html = ratings.map(v => constructHtml(v));
        const div_review = document.getElementById('reviews');
        div_review.innerHTML = html.join('');
    });
}

async function show50Reviews() {
    const url = `https://graph.facebook.com/v3.1/${page_id}/?access_token=${perm_token}&debug=all&fields=ratings&format=json&method=get&pretty=0&suppress_http_code=1`;
    let ratings = await get_reviews(url);
    const add_ratings = await get_reviews(ratings.ratings.paging.next);

    let all = ratings.ratings.data.concat(add_ratings.data);
    all = all.filter(v => v.hasOwnProperty("recommendation_type") && v.recommendation_type === 'positive');
    all = all.filter(v => v.hasOwnProperty("review_text") && v.review_text.length < review_maxlength);
    all = all.filter(v => (v.hasOwnProperty("rating") && v.rating >= 4) || !v.hasOwnProperty("rating"));

    const html = all.map(v => constructHtml(v));
    const div_review = document.getElementById('reviews');
    div_review.innerHTML = html.join('');
}


document.addEventListener("DOMContentLoaded", function(event) {
    //show_reviews(3);
    show50Reviews();
    load_overall_ratings();
});
