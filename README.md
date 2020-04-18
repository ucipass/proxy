# proxy
Web forward proxy (HTTP/HTTPS)

![](peek.gif)


## Usage

```sh
npm install @ucipass/proxy
```


Sample code:
```
const Proxy = require('@ucipass/proxy')
const proxyPort = 3128
const proxy = new Proxy(proxyPort)
proxy.start()
.then(()=>{
  // Use it for a while....
})
.then(() => proxy.stop())
```
