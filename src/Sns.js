class Sns {
    constructor(kakaoAppKey) {
        this.ogOriginalData = this.setOgOriginalData();
        this.ogData = {};

        this.usedKakao = false;

        kakaoAppKey && this.useKakao(kakaoAppKey);
    }


    /**
     * 기본 옵션 설정
     */
    setOgOriginalData() {
        const data = {};

        Array.from(document.querySelectorAll('[property^="og:"]')).forEach((elem) => {
            data[elem.getAttribute('property').replace('og:', '')] = elem.getAttribute('content');
        });

        data.popup_name = 'shareSNS';
        data.popup_width = 660;
        data.popup_height = 380;

        data.twitter_text = `${data.title} ${data.description}`;

        data.kakaotalk_label = `${data.title} \n ${data.description}`;
        data.kakaotalk_image_width = 606;
        data.kakaotalk_image_height = 606;
        data.kakaotalk_webbutton_text = '이벤트 참여하기';

        data.kakaostory_text = `${data.title} \n ${data.description}`;

        data.copyurl_copy = 'Ctrl+C를 눌러 복사하세요.';

        return data;
    }


    /**
     * 옵션 재설정
     *
     * @param {string|object} entry
     */
    setOgData(jsonData) {
        const setData = (() => {
            if (typeof jsonData == 'string') {
                try {
                    return JSON.parse(jsonData);
                } catch (e) {
                    return {};
                }
            } else if (typeof jsonData == 'object' && !Array.isArray(jsonData)) {
                return jsonData;
            } else {
                return {};
            }
        })();

        this.ogData = Object.assign({}, this.ogOriginalData, setData);
    }


    /**
     * 팝업 설정
     */
    open(url) {
        window.open(url, this.ogData.popup_name, `width=${this.ogData.popup_width}, height=${this.ogData.popup_height}, scrollbars=yes`);
    }


    /**
     * 주소 및 텍스트 인코딩
     */
    makeUrl(strings, ...values) {
        let url = strings[0];

        values.forEach((value, i) => {
            url += `${encodeURIComponent(value)}${strings[i + 1]}`;
        });

        return url;
    }


    /**
     * 카카오 사용
     */
    useKakao(appKey) {
        if (!this.usedKakao) {
            if (!appKey) {
                throw new Error('카카오 키 필요');
            }

            const kakao = this.loadKakaoApi();

            kakao.then(() => {
                this.initKakao(appKey);
                this.usedKakao = true;
            }).catch(() => console.log(new Error('카카오 API 링크를 확인해주세요')));
        }
    }

    /**
     * 카카오 API 스크립트 호출
     */
    loadKakaoApi() {
        return new Promise((resolve, reject) => {
            if (document.getElementById('kakao-js-sdk')) {
                resolve();
            }

            const target = document.getElementsByTagName('script')[0];
            const script = document.createElement('script');

            script.id = 'kakao-js-sdk';
            script.src = '//developers.kakao.com/sdk/js/kakao.min.js';
            script.async = true;
            script.onload = script.onreadystatechange = function () {
                if (!this.readyState || this.readyState == 'complete') {
                    resolve();
                }
            };
            script.onerror = script.onabort = reject;
            target.parentNode.insertBefore(script, target);
        });
    }

    /**
     * 카카오 init
     */
    initKakao(appKey) {
        window.Kakao.init(appKey);
    }


    /**
     * 공유 API
     */
    facebook(jsonData) {
        this.setOgData(jsonData);
        this.open(this.makeUrl `https://www.facebook.com/sharer/sharer.php?u=${this.ogData.url}`);
    }

    twitter(jsonData) {
        this.setOgData(jsonData);
        this.open(this.makeUrl `https://twitter.com/intent/tweet?text=${this.ogData.twitter_text}&url=${this.ogData.url}`);
    }

    googleplus(jsonData) {
        this.setOgData(jsonData);
        this.open(this.makeUrl `https://plus.google.com/share?url=${this.ogData.url}`);
    }

    pinterest(jsonData) {
        this.setOgData(jsonData);
        this.open(this.makeUrl `https://pinterest.com/pin/create/button/?url=${this.ogData.url}&media=${this.ogData.image}&description=${this.ogData.title}`);
    }

    linkedin(jsonData) {
        this.setOgData(jsonData);
        this.open(this.makeUrl `https://www.linkedin.com/shareArticle?mini=true&url=${this.ogData.url}&title=${this.ogData.title}&summary=${this.ogData.description}&source=${this.ogData.site_name}`);
    }

    kakaotalk(jsonData) {
        this.setOgData(jsonData);

        Kakao.Link.sendTalkLink({
            label: this.ogData.kakaotalk_label,
            image: {
                src: this.ogData.image,
                width: this.ogData.kakaotalk_image_width,
                height: this.ogData.kakaotalk_image_height
            },
            webButton: {
                text: this.ogData.kakaotalk_webbutton_text,
                url: this.ogData.url
            },
            installTalk: true,
            fail: function () {
                alert('현재 플랫폼에서 사용할 수 없습니다.');
            }
        });
    }

    kakaostory(jsonData) {
        this.setOgData(jsonData);

        Kakao.Story.share({
            url: this.ogData.url,
            text: this.ogData.kakaostory_text
        });
    }

    kakaostoryapp(jsonData) {
        this.setOgData(jsonData);

        Kakao.Story.open({
            url: this.ogData.url,
            text: this.ogData.kakaostory_text
        });
    }

    copyurl(jsonData) {
        this.setOgData(jsonData);

        prompt(this.ogData.copyurl_copy, this.ogData.url);
    }
}

export default Sns;
