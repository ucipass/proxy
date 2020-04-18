# proxy
Web forward proxy

Sample usage:
```
const proxy = new Proxy(3128)
proxy.start()
.then(()=>{
  // Use it for a while....
})
.then(() => proxy.stop())
```
