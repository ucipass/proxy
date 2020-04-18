# proxy
Web forward proxy (HTTP/HTTPS)

![](peek.gif)


## Usage

```sh
npm install @ucipass/proxy
```


Sample code:
```
const proxy = require('@ucipass/proxy')
const proxyPort = 3128
proxy(proxyPort)
.then(()=>{
  // Use it for a while....
})
.then(() => proxy.stop())
```
