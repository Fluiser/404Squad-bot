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
            try{
                (typeof arg === 'string' ? get(arg) : get(this.path).query(arg))
                    .end((error, response) => {
                        if(response.status != 200) {
                            console.log(response.text);
                            resolve([]);
                        }
                        else {
                            resolve(response.body || response);
                        }
                    });
            } catch(err) {/*what you do, superagent(dalbaeb)?*/}
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
        try{
            for(const _e of (rdata.post || rdata)) {
                if(this.lastId >= _e.id) break;
                data.push(_e);
            }
        } catch(err) {
            console.log(rdata);
            throw err;
        }
        if(data.length)
            this.lastId = (data.find(p => (Date.now()-new Date(p.created_at).getTime()) >= 3000*60*60 /* 3 hours*/) || data[data.length-1]).id;
        return data;
    }
}
