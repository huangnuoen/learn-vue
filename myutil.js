/**
 * Ensure a function is called only once.确保函数只执行一次
 */
export function once(fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}

/* 滚动穿透 */
export function fixedRollThrough() {
  let bodyEl = document.body
  let top = window.scrollY
  return function (forbidScroll) {
    // 禁止穿透
    if (forbidScroll) {
      top = window.scrollY
      bodyEl.style.position = 'fixed'
      bodyEl.style.top = -top + 'px'
      bodyEl.style.left = '0'
      bodyEl.style.right = '0'
    } else {
      bodyEl.style.position = ''
      bodyEl.style.top = ''
      bodyEl.style.left = ''
      bodyEl.style.right = ''
      window.scrollTo(0, top)
    }
  }
}
/* 图片懒加载 未完 */
export function lazyImg() {

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
}

/* 冒泡排序 */
    let a = [11, 2, 22, 111, 8, 31, 44, 32, 1, 9]

    function sort(arr, n) {
      if (n <= 1) return arr
      for (let i = 0; i < arr.length; i++) {
        const temp = arr[i]
        if (temp > arr[i + 1]) {
          arr[i] = arr[i + 1]
          arr[i + 1] = temp
        }
      }
      console.log(arr, --n)

      return sort(arr, n)
    }
    sort(a, a.length)

    