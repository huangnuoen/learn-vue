function lazy() {
  var selector = Array.from(document.querySelectorAll('.avatar'));

  var io = new IntersectionObserver((changes) => {
    changes.forEach((change) => {
      var container = change.target
      if (change.intersectionRatio > 0) {
        let src = container.getAttribute('data-src')
        if (!container.getAttribute('src')) {
          container.setAttribute('src', src)
          io.unobserve(container)
        }

      }
    })
  });
  selector.forEach(item => {
    io.observe(item)
  })
  // 停止观察
  // io.unobserve(element);

  // 关闭观察器
  // io.disconnect();
}
setTimeout(() => {

  lazy()
}, 2000);