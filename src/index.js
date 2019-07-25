const Message = {
    TYPE: 'SNS 타입 확인',
    NOT_SUPPORT: 'SNS 미지원'

};

const Type = [
    'facebook',
    'twitter',
    'naver',
    'band',
    'kakao',
    'kakaostory',
    'copyurl'
];

const Api = {
    kakao: '//developers.kakao.com/sdk/js/kakao.min.js'
};

const ShareSNS = class {
    constructor() {
        this._openGraph = {};
        this._type = '';
        this._shareUrl = '';

        this._setOriginalOpenGraph();

        Type.forEach(sns => {
            this[sns] = (openGraph) => this.share(sns, openGraph);
        });
    }

    _setType(type) {
        if (!type || typeof type !== 'string') {
            console.log(Message.TYPE);
            return;
        }

        const lowerType = type.replace(/[_-]/g, '').toLowerCase();

        if (Type.includes(lowerType)) {
            console.log(Message.NOT_SUPPORT);
            return;
        }

        this._type = lowerType;

        return this;
    }

    _setOriginalOpenGraph() {
        const ogTags = Array.from(document.querySelectorAll('[property^="og:"]'));

        this._originalOpenGraph = ogTags.reduce((og, tag) =>
            (og[tag.getAttribute('property').replace('og:', '')] = tag.getAttribute('content'), og), {});
    }

    _setOpenGraph(openGraph) {
        let newOpenGraph = {};

        if (typeof openGraph === 'string') {
            try {
                newOpenGraph = JSON.parse(openGraph);
            } catch (e) {
                console.log('JSON error');
            }
        }

        if (typeof openGraph === 'object' && !Array.isArray(openGraph)) {
            newOpenGraph = openGraph;
        }

        this._openGraph = Object.assign({}, this._originalOpenGraph, newOpenGraph);

        return this;
    }

    _encodeUrl(strings, ...values) {
        return values.reduce((url, value, index) =>
            (url += `${encodeURIComponent(value)}${strings[index + 1]}`, url), strings[0]);
    }

    _makeUrl() {
        const type = `_makeUrl${this._type.replace(/^[a-z]/, char => char.toUpperCase())}`;
        const method = this[type] || this._makeUrlDefault;

        this._shareUrl = method();

        return this;
    }
    _makeUrlFacebook() {
        return this._encodeUrl `https://www.facebook.com/sharer/sharer.php?u=${this._openGraph.url}`;
    }
    _makeUrlTwitter() {
        const og = this._openGraph;
        return this._encodeUrl `https://twitter.com/intent/tweet?text=${og.title} ${og.description}&url=${og.url}`;
    }
    _makeUrlNaver() {
        const og = this._openGraph;
        return this._encodeUrl `https://share.naver.com/web/shareView.nhn?url=${og.url}&title=${og.title}`;
    }
    _makeUrlBand() {
        const og = this._openGraph;
        return this._encodeUrl `https://band.us/plugin/share?body=${og.title}&route=${og.url}`;
    }
    _makeUrlDefault() {
        return this._openGraph.url;
    }

    _open() {
        window.open(this._shareUrl, null, 'width=600, height=400, location=0, menubar=0, resizeable=0, scrollbars=0, status=0, titlebar=0, toolbar=0');

        return this;
    }

    _share(type, openGraph) {
        this._setType(type)
            ._setOpenGraph(openGraph);

        switch (type) {
            case 'kakao':
            case 'kakaostory':
            case 'copyurl':
                this[`_${this._type}`]();
                break;

            default:
                this._makeUrl()
                    ._open();
        }
    }

    _kakao() {
        const og = this._openGraph;

        Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
                title: og.title,
                description: og.description,
                imageUrl: og.image,
                link: {
                    mobileWebUrl: og.url,
                    webUrl: og.url
                }
            }
        });
    }

    _kakaostory() {
        const og = this._openGraph;

        Kakao.Story.share({
            url: og.url,
            text: `${og.title} ${og.description}`
        });
    }

    _copyurl() {
        if (window.clipboardData && window.clipboardData.setData) {
            window.clipboardData.setData('Text', this._openGraph.url);
        } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
            const textarea = document.createElement('textarea');

            textarea.value = this._openGraph.url;
            textarea.readOnly = true;
            textarea.style.cssText = `position: absolute; 
                top: ${window.pageYOffset || window.scrollY || document.documentElement.scrollTop}px; 
                left: -9999px; 
                margin: 0; 
                padding: 0; 
                border: 0; 
                font-size: 12px;`;
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            try {
                document.execCommand('copy');
            } catch (e) {
                console.log(new Error('주소 복사 실패'))
            } finally {
                document.body.removeChild(textarea);
            }
        }

        return this;
    };

    _loadApi(type) {
        return new Promise((resolve, reject) => {
            const isUsed = document.querySelector(`script[src*=${Api[type]}]`) || document.querySelector(`script[id=${type}-js-sdk]`);

            if (isUsed) {
                resolve();
            }

            const target = document.getElementsByTagName('script')[0];
            const script = document.createElement('script');

            script.id = `${type}-js-sdk`;
            script.src = Api[type];
            script.async = true;
            script.onload = script.onreadystatechange = function () {
                if (!this.readyState || this.readyState === 'complete') {
                    resolve();
                }
            };
            script.onerror = script.onabort = reject;
            target.parentNode.insertBefore(script, target);
        });
    }

    useKakao(appKey) {
        if (!this.useKakao.used) {
            if (!appKey) {
                throw new Error('카카오 키 필요');
            }

            const kakao = this._loadApi('kakao');

            kakao
                .then(() => {
                    window.Kakao.init(appKey);
                    this.useKakao.used = true;
                })
                .catch(() => {
                    console.log(new Error('카카오 API 링크를 확인해주세요'));
                });
        }
    }

    share(type, openGraph) {
        this._share(type, openGraph);
    }
};

export default ShareSNS;
