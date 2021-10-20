const {get} = require('superagent');
const {writeFileSync, readFileSync} = require('fs');

const tryRead = path => {
    try { return readFileSync(path); } catch { return null; }
}

module.exports = class {
    constructor(url /*I love json*/, id) {
        this.path = url;
        this.lastId = +tryRead(id + '.cache');
        this.id = id;
    }

    async request(arg) {
        return new Promise(resolve => {
            (typeof arg === 'string' ? get(arg) : get(this.path).query(arg))
                .end((error, response) => {
                    if(error) throw error;
                    else {
                        resolve(response.body || response);
                    }
                });
        })
    }

    save() {
        writeFileSync(this.id + '.cache', this.lastId + '');
    }

    async gets() {
        // let data = [];
        // let offset = 0;
        // for(let rdata = await this.request();; rdata = await this.request({offset})) {
        //     offset += rdata.length;
        //     if(!this.lastId) {
        //         data = rdata;
        //         this.lastId = data[0] && data[0].id;
        //         return data;
        //     } else {
        //         for(const _e of rdata) {
        //             if(_e.id === this.lastId) {
        //                 this.lastId = data[0] && data[0].id;
        //                 return data;
        //             }
        //             data.push(_e);
        //         }
        //     }
        // }
        const data = [];
        const rdata = await this.request();
        for(const _e of rdata) {
            if(this.lastId >= _e.id) break;
            data.push(_e);
        }
        this.lastId = data.find(p => (Date.now()-new Date(p.created_at).getTime()) >= 3000*60*60 /* 3 hours*/).id || data[data.length-1].id;
        return data;
    }
}
