### What?

A quick timer utility that suppport many timers at the same time, uses `performance.now()` when available,
supports auto page reloading, submitting data to a server, timeouts, cross and in domain frame communications,
displaying results on screen, and works in most browsers without any other dependencies, down to IE8.


### Script 

```html
<script src="./timer.js"><script>
```


### Optional query params

* `timerAutoreload=true|false` defaults to `false`, will reload the test page 3 seconds after the LAST timer stops/timesout
* `timerPersistapi= true|//myserver.com/some-path`, defaults to `false`. if `true` it will submit a `GET` to `timer.php` which is sibling file of `timer.js`, if other `URL VALUE`, it will use that
* `timerTimeout=true|60000`, defaults to `false`, if number, it will timeout and stop all timers after that many milliseconds
* `timerHidden=true|false`, defaults to `true` does not display the results on the top of the page

#### Example
```
http://example.com/mytestpage.html?timerAutoreload=true&timerPersistapi=//localhost/results&timerTimeout=60000&timerHidden=false
```


### JS usage

```html
<script>
    
    // If you do not want to use the Query params, you can set these values on the global `timer`
    timer.timeout = 30000;
    timer.hidden = false;
    timer.persistapi = '/localhost/some/path';
    timer.autoreload = true;
    
    // then you can override one or more for a specific test
    timer.start('test-1', {
        hidden: true,
        timeout: 120000,
        persistapi: '//myotherserver.com/some/path'
    })
    
    // will use the global options
    timer.start('test-2'); 
    
    // hidden option is overwriten, but the rest are the globals
    timer.start('test-3', {hidden: true}); 
    
    // NOTE:
    // you cannot individually, per test, overwrite the autoreload option, this one must be set globally
    // because it affects all others
    
    
    // .... some time later
    timer.stop('test-2');
    
    // .. whenever
    timer.stop('test-3');
    
    timer.stop('test-1');
    
    // if timer.autoreload ===true, and only after the last timer has stopped the page will be reloaded
    
</script>
```

### Option `persistapi`

As mentioned earlier, if the query param `timerPersistapi=VALUE` or if `timer.persisapi` is set, at the end of each `timer.stop()` a `GET` request is submitted to that api url with the following query params

* `label`, the name/id of test encoded
* `duration`, in milliseconds
* `clientdate`, an ISO date string generated at the client's browser
* `page`, the current `location.href` encoded

Example:
```
GET URL: http://localhost/some/path?label=test-1&duration=2000.21&cliendate=2014-10-17T20%3A57%3A38.772Z&page=http%3A%2F%2Flocalhost%2Ftest.html%3FtimerAutoreload%3Dtrue%26timerPersistapi%3Dhttp%3A%2F%2Flocalhost%2Fsome%2Fpath
```


### Cross Frames

Each timer also submits a postMessage to its parent page, along with listening to postMessages from child pages 
so if you have this setup

```
In parentWindow 
 >> html: <script src=timer.js>
 >> js: timer.start("my-label");
 >> window.parent.postMessage('timer:started:my-label,' + JSON.stringify(options), '*');

      In child Window
      >> html: <script src=timer.js>
      >> js: timer.stop("my-label");
      >> window.parent.postMessage('timer:stopped:my-label,' + JSON.stringify(options), '*');
      >> js: timer.start("my-label-2");
      >> window.parent.postMessage('timer:started:my-label-2,' + JSON.stringify(options), '*');
      >> js: timer.stop("my-label-2");
      >> window.parent.postMessage('timer:stopped:my-label-2,' + JSON.stringify(options), '*');

      >> window.parent.postMessage('timer:done:', '*'); // if it's the last one

In parentWindow
>> window.parent.postMessage('timer:done:', '*'); if the last one is stopped

     
// the timer, labeled "my-label" will be stopped when the child frame timer.stop("my-label");
// (the child frame secretly tries to access the window.top.timer.stop("my-label"), but if that fails due to x-domain frame, it uses the postMessage)
```
  
 


