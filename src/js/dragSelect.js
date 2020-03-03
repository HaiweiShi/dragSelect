

function clearSelections () {
  if (window.getSelection) {
      // 获取选中
      var selection = window.getSelection();
      // 清除选中
      selection.removeAllRanges();
  } else if (document.selection && document.selection.empty) {
     // 兼容 IE8 以下，但 IE9+ 以上同样可用
      document.selection.empty();
      // 或使用 clear() 方法
      // document.selection.clear();
  }       
}

/**
 * 获取距目标元素左侧的距离
 * @param {*} option 元素
 * @param {*} ele 目标元素 默认document.body
 */
function getEleOffsetLeft(option, ele) {
  ele = ele || document.body;
  var left = 0;
  if (option != ele && option.offsetParent) {
    left += getEleOffsetLeft(option.offsetParent, ele);
  }
  left += option.offsetLeft;
  return left;
}

/**
 * 获取距目标元素顶部的距离
 * @param {*} option 
 * @param {*} ele 
 */
function getEleOffsetTop(option, ele) {
  ele = ele || document.body;
  var top = 0;
  if (option != ele && option.offsetParent) {
    top += getEleOffsetTop(option.offsetParent, ele);
  }
  top += option.offsetTop;
  return top;
}

/**
 * 获取距目标元素向下滚动距离
 * @param {*} option
 * @param {*} ele 
 */
function getEleScrollLeft(option, ele) {
  ele = ele || document.body;
  var left = 0;
  if (option != ele && option.parentNode) {
    left += getEleScrollLeft(option.parentNode, ele);
  }
  left += option.scrollLeft;
  return left;
}

/**
 * 获取距目标元素向右滚动距离
 * @param {*} option 
 * @param {*} ele 
 */
function getEleScrollTop(option, ele) {
  ele = ele || document.body;
  var top = 0;
  if (option != ele && option.parentNode) {
    top += getEleScrollTop(option.parentNode, ele);
  }
  top += option.scrollTop;
  return top;
}

/**
 * 获取方法
 * @returns DS
 */
function getDS() {
  var shade = null; // 选区遮罩
  shade = document.createElement('i'); //创建一个div元素
  shade.style.position = 'absolute';
  shade.className = 'ds-shade';
  var sX = 0; // 拖拽开始位置（第一次触发时）的X坐标
  var sY = 0; // Y坐标
  var eX = 0; // 拖拽结束位置（最近一次触发时）的X坐标
  var eY = 0; // Y坐标
  var eleList = [];
  var vList = [];
  var valueKey = "value";
  function getOption(ele){
    if (ele && ele.getElementsByClassName) {
      return ele.getElementsByClassName('ds-option')
    }
    return []
  }
  // 清空上个last-focus 添加last-focus 用于shift选择
  function resetLastFocus(ele, option) {
    var lastArr = ele.getElementsByClassName('last-focus')
    for (var i = 0; i < lastArr.length; i++) {
      lastArr[i].classList.remove("last-focus")
    }
    option.classList.add("last-focus")
  }
  function addSelect(eleArr, beginEle, endEle){
    var begin = null
    var end = null
    var arr = []
    for (var i = 0; i < eleArr.length; i++) {
      const item = eleArr[i];
      if (beginEle == item) begin = i;
      if (begin != null) arr.push(item);
      if (endEle == item) {
        end = i
        break
      }
    }
    if (end != null) {
      for (var i = 0; i < arr.length; i++) {
        arr[i].classList.add("ds-checked");
      }
    }
  }
  /**
   * 
   * @param {*} e 事件对象
   * @param {*} ele 拖拽容器element
   * @param {*} flag 是否单选
   */
  function setShage(e, ele) {
    eX = e.pageX - getEleOffsetLeft(ele) + getEleScrollLeft(ele); // - ele.offsetLeft
    eY = e.pageY - getEleOffsetTop(ele) + getEleScrollTop(ele); // - ele.offsetTop
    shade.style.left = sX + 'px';
    shade.style.top = sY + 'px';
    shade.style.width = Math.abs(eX - sX) + 'px'; // 计算差值取正数
    shade.style.height = Math.abs(eY - sY) + 'px';
    var shadeX1 = sX; // shade左上角的X坐标
    var shadeY1 = sY; // shade左上角的Y坐标
    var shadeX2 = eX; // shade右下角的X坐标
    var shadeY2 = eY; // shade右下角的Y坐标
    if (eX - sX < 0) {  // 如果结束时坐标比开始时坐标小，调整 shade 定位位置，并交换坐标信息
      shade.style.left = eX + 'px'; shadeX1 = eX; shadeX2 = sX;
    }
    if (eY - sY < 0) {
      shade.style.top = eY + 'px'; shadeY1 = eY; shadeY2 = sY;
    }
    var arr = getOption(ele)
    var lastFocus = null
    var startFocus = null
    for (var i = 0; i < arr.length; i++) {
      var option = arr[i];
      var x1 = option.offsetLeft;
      var y1 = option.offsetTop;
      var x2 = option.offsetLeft + option.clientWidth;
      var y2 = option.offsetTop + option.clientHeight;
      if (option.classList.contains('last-focus')) {
        lastFocus = option
      }
      if (
        (shadeX1 <= x1 && shadeX2 >= x2 && shadeY1 <= y1 && shadeY2 >= y2) || // 判断 可选项 在 shade 内：图2
        (shadeX1 >= x1 && shadeX2 <= x2 && shadeY1 >= y1 && shadeY2 <= y2) || // 判断 shade 在 可选项 内：图3
        ( // 判断 可选项 与 shade 右边线/左边线有相交：图4
          ((shadeY1 <= y1 && shadeY2 >= y1) || (shadeY1 <= y2 && shadeY2 >= y2) ) && // y1 或 y2 在 shadeY1 和 shadeY2 之间
          ((shadeX1 >= x1 && shadeX1 <= x2) || (shadeX2 >= x1 && shadeX2 <= x2)) // shadeX1 或 shadeX2 在 x1 和 x2 之间
        ) ||
        ( // 判断 可选项 与 shade 上边线/下边线有相交：图5
          ((shadeX1 <= x1 && shadeX2 >= x1) || (shadeX1 <= x2 && shadeX2 >= x2)) && // x1 或 x2 在 shadeX1 和 shadeX2 之间
          ((shadeY1 >= y1 && shadeY1 <= y2) || (shadeY2 >= y1 && shadeY2 <= y2)) // shadeY1 或 shadeY2 在 y1 和 y2 之间
        )
      ) {
        if (e.shiftKey) {
          if (lastFocus) {
            addSelect(arr, lastFocus, option)
          } else {
            startFocus = option
          }
        } else if (e.ctrlKey && vList.indexOf(option.dataset[valueKey]) > -1) {
          option.classList.remove("ds-checked");
        } else {
          resetLastFocus(ele, option)
          option.classList.add("ds-checked");
        }
      } else {
        if (!e.ctrlKey || vList.indexOf(option.dataset[valueKey]) < 0) {
          option.classList.remove("ds-checked");
        }
      }
    }
    if (startFocus && lastFocus) {
      addSelect(arr, startFocus, lastFocus)
    } else if(startFocus && lastFocus === null && arr[0]){
      addSelect(arr, arr[0], startFocus)
    }
  }
  function getValue(ele, data){
    if (data && data.callBack) {
      eleList = ele.getElementsByClassName('ds-checked');
      vList = [];
      for (var i = 0; i < eleList.length; i++) {
        vList.push(eleList[i].dataset[valueKey]);
      }
      data.callBack(vList, eleList)
    }
  }
  function DS(ele, data) {
    if (ele) {
      valueKey = data.value || 'value';
      function clickFun(e, flag) {
        var e = e || window.event;
        ele.onmousemove = null;
        document.onclick = null;
        setShage(e, ele, flag);
        getValue(ele, data);
        try {
          ele.removeChild(shade);
        } catch (error) {
          console.log(error);
        }
      }
      ele.onmousedown = function (e) {
        var e = e || window.event;
        if (e.button != 0) {
          return;
        }
        clearSelections()
        sX = e.pageX - getEleOffsetLeft(ele) + getEleScrollLeft(ele); // ele.offsetLeft
        sY = e.pageY - getEleOffsetTop(ele) + getEleScrollTop(ele); // ele.offsetTop
        if (e.target.draggable) { // 可拖拽
          document.onclick = function(e) {
            clickFun(e)
          }
          return;
        }
        ele.appendChild(shade);
        setShage(e, ele);
  
        ele.onmousemove = function (e) {
          var e = e || window.event;
          setShage(e, ele);
        }
        document.onclick = clickFun;
      }
    }
  }
  function cancelDS(ele) {
    ele.onmousedown = null;
    ele.onmousemove = null;
    document.onclick = null;
  }
  DS.cancelDS = cancelDS;
  return DS;
}
// export default getDS()