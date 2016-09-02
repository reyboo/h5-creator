var utils = {
  getCss: function(ele) {
    var oStyle = ele.currentStyle ? ele.currentStyle : window.getComputedStyle(ele, false);
    return oStyle;
  },
  rgbToHex: function(rgb) {
    var a = rgb.split("(")[1].split(")")[0].split(",");
    return "#" + a.map(function(x) {
      x = parseInt(x).toString(16);
      return (x.length == 1) ? "0" + x : x;
    }).join("");
  },
  matchEle: function(origin, target) {
    return $.each(origin, function(k, v) {
      if ($(v).attr('key') === target) {
        return $(v)
      }
    })
  },
  toPercent: function(origin, num) {
    return (num / origin).toFixed(2) * 100 + '%';
  },
  percentTo: function(origin, num) {
    return origin.replace(/[%]/g, '') / 100;
  },
  storage: {
    get: function(name) {
      var res = localStorage.getItem(name);
      if (res) {
        return JSON.parse(res);
      } else {
        return null;
      }
    },
    set: function(name, jsonObj) {
      localStorage.setItem(name, JSON.stringify(jsonObj));
    },
    remove: function(name) {
      localStorage.removeItem(name);
    }
  },
  fetch: function(url, method, obj, successCb, errerCb) {
    if (method === 'post') {
      return fetch(config.url + url, {
        method: 'post',
        headers: {
          "Content-Type": "application/json",
        },
        mode: 'cors',
        body: JSON.stringify(obj)
      }).then(function(res) {
        return res.json().then(function(json) {
          if (json.code) {
            return successCb && successCb(json.data)
          }
          errerCb && errerCb(json.msg)
        })
      })
    }
    return fetch(config.url + url, {
      headers: {
        "Content-Type": "application/json",
      }
    }).then(function(res) {
      return res.json().then(function(json) {
        if (json.code) {
          return successCb && successCb(json.data)
        }
        errerCb && errerCb(json.msg)
      })
    })
  },
  getQueryString: function(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
  }
}


//========================================================================wangxiaowei begin
var ObjComponent = ObjPreview = null;

// 组件对象，包括组建事件，增删改查等
function _Component(){
  // 一些基本的dom对象
  var domUlTypeSelect   = $('#ul_typeSelect') ,
      domUlTypeSelectC  = $('#ul_typeSelectContent') ,

      domAllTypeLi = null,
      domAllContent =  null;

  var componentsData = {};
  var componentTypes = [
    {name:'标题' ,key:'title'   ,img:'text.png'},
    {name:'图片' ,key:'image'   ,img:'image.png'},
    {name:'段落' ,key:'chapter' ,img:'card.png'},
    {name:'图文' ,key:'mashup'  ,img:'titlecart.png'}
  ]
  // 一些基本的方法
  // 获取元件，仅获取一次，若没网，应该从localstore中读取
  var getComponentData = function(){
    utils.fetch('/components/get', 'get', '', function(res) {
      var tempResult = {} ,_temp = null;
      $.each(res.lists, function(k, v) {
        _temp = v.category;
        if(!tempResult[_temp]){
          tempResult[_temp] = [];
        }
        tempResult[_temp].push(v);
      });
      componentsData = tempResult;
      loadComponentTab();
    })
  },
  // 加载左侧组件的列表
  getComponentAList = function(key){
    var html = [] ,data = componentsData[key];
    if(!data)  return  '';
    for(var i=0,len=data.length;i<len;i++){
      html.push(data[i].content);
    }
    return html.join('');
  },
  // 加载系统模板上方的组件类型
  loadComponentTab = function(){
    var html = [] ,htmlContent = [];
    // TODO
    for(var i=0,len=componentTypes.length,item ,_key;i<len;i++){
      item = componentTypes[i];
      _key = item.key;
      if(i == 0){
        html.push('<li class="active" data="'+_key+'">');
        htmlContent.push('<div class="'+_key+'_temp" data="'+_key+'">');
      }else{
        html.push('<li data="'+_key+'">');
        htmlContent.push('<div class="'+_key+'_temp" data="'+_key+'" style="display:none">');
      }
      htmlContent.push(getComponentAList(_key) + '</div>');
      html.push('<img src="./static/images/'+item.img+'" alt="'+_key+'"><p>'+item.name+'</p></li>');
    }
    domUlTypeSelect.html(html.join(''));
    domUlTypeSelectC.html(htmlContent.join(''));
    loadEvent();
  },
  // 加载完dom节点后，加载该节点的事件
  loadEvent = function(){
    var leftSource = document.querySelector('.title_temp') ,
        rightSource = document.querySelector('#viewContent');
    dragula([leftSource, rightSource] ,{
      copy: function (el, source) {
        return source === leftSource
      },
      accepts: function (el, target) {
        return target !== leftSource
      }
    }).on('drag', function (el) {
      el.className = el.className.replace('ex-moved', '');
    }).on('drop', function (el) {
      el.className += ' ex-moved';
    });



    domAllContent   = domUlTypeSelectC.children('[class$=_temp]');
    domAllTypeLi    = domUlTypeSelect.children('li');
    // Tab 切换
    domUlTypeSelect.children('li').on('click' ,function(){
      var _this = $(this);
      domAllContent.hide();
      domAllTypeLi.removeClass('active');
      _this.addClass('active');
      domUlTypeSelectC.children('.'+_this.attr('data')+'_temp').show();
    })
  }

  // 执行加载
  getComponentData();
}
function _Preview(){
  var domView = $('#viewContent');
  return {
    onClickEle : function(obj ,e){
      domView.find('[contenteditable="true"]').removeAttr('contenteditable');
      $(obj).attr('contenteditable' ,'true');
    }
  }
}

ObjPreview = _Preview();
//========================================================================wangxiaowei end


// 如果首次url中存在id则拉取数据
if (utils.getQueryString('id')) {
  utils.fetch('/page/preview?id=' + utils.getQueryString('id'), 'get', '', function(res) {
    $('.view_content').html(res.content)
    ObjComponent = _Component();
  })
}else{
  ObjComponent = _Component();
}

// 记录最后一次操作的元素
var lastTarget;
// 将选中的元素样式添加至可视区
var NODE = ['IMG'];

function textView(ele) {
  var styles = utils.getCss(ele[0]),
    text = ele.text();
  $('#eleText').val(text);
  $('#eleSize').val(styles.fontSize);
  $('#eleWidth').val(utils.toPercent($('.view_content').width(), $(ele).width()));
  $('#eleHeight').val(styles.height);
  $('#eleBorder').val(styles.border);
  $('#eleMargin').val(styles.margin);
  $('#elePadding').val(styles.padding);
  $('#eleColor').val(utils.rgbToHex(styles.color));

  $.each($('#eleSize > *'), function(k, v) {
    if ($(v).attr('value') == styles.fontSize) {
      $(v).attr('selected', true).siblings().removeAttr('selected')
    }
  })

  $.each($('#eleFontWeight > *'), function(k, v) {
    if ($(v).attr('value') === styles.fontWeight) {
      $(v).attr('selected', true)
    }
  })

  $.each($('#eleAlign > *'), function(k, v) {
    if (styles.textAlign === 'start') {
      return $('#eleAlign button').eq(0).addClass('btn-success').siblings().removeClass('btn-success')
    }
    if ($(v).attr('align') === styles.textAlign) {
      $(v).addClass('btn-success').siblings().removeClass('btn-success')
    }
  })
}

// 检查元素类型
function checkType(type, ele) {
  textView($(ele));
}

$('.tmp_content').on('click', ' > * > *', function(evt) {
  checkNode(evt)
  var _clone = lastTarget = $(this).clone();
  $('.view_content').append(_clone);
  checkType($(this).attr('type'), this);
  evt.stopPropagation;
})

function checkNode(evt) {
  if (NODE.indexOf(evt.target.nodeName) >= 0) {
    $('#eleText').parents('.form-group ').hide();
    $('#eleUrl').parents('.form-group ').show();
    $('#images_tmp').show().siblings().hide();
  } else {
    $('#eleUrl').parents('.form-group ').hide();
    $('#eleText').parents('.form-group ').show();
  }
}

$('.view_content').on('click', '*', function(evt) {
  checkNode(evt)
  lastTarget = $(this);
  ObjPreview.onClickEle(this ,evt);
  evt.stopPropagation();
  checkType($(this).attr('type'), this)
})

function createSizeOption(min, max) {
  var str = '';
  for (var i = min; i < max; i++) {
    if (i % 2 === 0) {
      str += '<option value=' + i + 'px>' + i + '</option>'
    }
  }
  return str;
}
Date.prototype.Format = function(fmt) { //author: meizz
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

// 标题编辑
var editTitle = {
  init: function() {
    this.changeSize();
    this.changeWeight();
    this.changeColor();
    this.changeAlign();
    this.changeText();
    this.changeRange();
    this.changeLayout();
    this.changeUrl();
  },
  changeUrl: function() {
    $('#upload-file').on('change', function(evt) {
      console.log(this)
      var file = this.files[0];
      if (!/image\/\w+/.test(file.type)) {
        alert("文件必须为图片！");
        return false;
      }
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function(e) {

        var formData = new FormData();
        formData.append('file', file)
        $.ajax({
          url: 'http://127.0.0.1:3001/file/loadfile',
          type: 'POST',
          data: formData,
          async: false,
          cache: false,
          contentType: false,
          processData: false,
          success: function(data) {
            $(lastTarget).attr('src', e.srcElement.result)
            var str = '<li><div class="img_box" style="height:100px">' +
              '<img src="' + data.data.url + '" alt="' + data.data.name + '">' +
              '</div>' +
              '<div>' +
              '<span>' + data.data.name + '</span>' +
              '</div>' +
              '</li>'
            $('#images_list_content').prepend(str);
          },
          error: function() {
            $("#spanMessage").html("与服务器通信发生错误");
          }
        });
      }
    })
  },
  changeText: function() {
    $('#eleText').on('input propertychange', function(event) {
      $(lastTarget[0]).text($(this).val());
    })
  },
  changeSize: function() {
    $('#eleSize').on('change', function(evt) {
      var attr = $('#eleSize :selected').val();
      $(lastTarget).css({
        fontSize: attr
      })
    })
  },
  changeLayout: function() {
    $('#eleMargin').on('input propertychange', function(event) {
      $(lastTarget).css({
        margin: $(this).val()
      });
    })
    $('#elePadding').on('input propertychange', function(event) {
      $(lastTarget).css({
        padding: $(this).val()
      });
    })
    $('#eleBorder').on('input propertychange', function(event) {
      $(lastTarget).css({
        border: $(this).val()
      });
    })
  },
  changeRange: function() {
    $('#eleWidth').on('input propertychange', function(event) {
      $(lastTarget).css({
        width: $(this).val(),
      })
      var h = $(lastTarget).height() + 'px'
      $('#eleHeight').val(h)
    })
    $('#eleHeight').on('input propertychange', function(event) {
      $(lastTarget).css({
        height: $(this).val(),
      })
    })
  },
  changeWeight: function() {
    $('#eleFontWeight').on('click', function(evt) {
      var attr = $('#eleFontWeight :selected').val();
      $(lastTarget).css({
        fontWeight: attr
      })
    })
  },
  changeColor: function() {
    $('#eleColor').on('change', function(evt) {
      var attr = $(this).val();
      $(lastTarget).css({
        color: attr
      })
    })
  },
  changeAlign: function() {
    $('#eleAlign button').on('click', function(evt) {
      $(this).addClass('btn-success').siblings().removeClass('btn-success');
      var attr;
      if ($(this).hasClass('btn-success')) {
        attr = $(this).attr('align');
      }
      $(lastTarget).css({
        textAlign: attr
      })
    })
  }
}

$('.deleteComponent').on('click', function() {
  $(lastTarget).remove();
})

// 点击元素改变视图
// var viewSwitch = function(light, data) {
//   light.addClass('active').siblings().removeClass('active');
//   var activeSwitch = function(ele) {
//     $.each($(ele), function(k, v) {
//       if ($(v).attr('data') == data) {
//         $(v).show().siblings().hide();
//       }
//     })
//   }
//   activeSwitch('.tmp_content >div')
//     // activeSwitch('.edit_content >div')
// }

// // view 切换
// $('.typeSelect li').on('click', function() {
//   var data = $(this).attr('data');
//   viewSwitch($(this), data)
// })

$('#eleSize').html(createSizeOption(12, 42))

editTitle.init();

$('#save').on('click', function() {
  utils.storage.set('content', $('.view_content').html());
  alert('已保存,下次会默认打开您最后一次保存的记录')
})
$('#reset').on('click', function() {
  $('.view_content').html('');
  utils.storage.remove('content')
})

$('.view_content').html(utils.storage.get('content'));


$('#phoneView').on('click', function() {
  if (!$('.view_content').html()) return alert('好像没有什么可查看的噢');
  if (!$('#pageTitle').val()) {
    $('#pageTitle').addClass('tips');
    return alert('先取个好听的名字才能保存噢');
  }
  $('#pageTitle').removeClass('tips');
  utils.fetch('/page/preview', 'post', {
    "create_time": new Date(),
    "content": $('.view_content').html(),
    "name": $('#pageTitle').val(),
    "id": utils.getQueryString('id')
  }, function(res) {
    window.history.pushState(null, null, '?id=' + res.id);
    $('#previewModal').modal('show')
    $('#prevlink').text(res.link).attr('href', res.link)
    $('#qrcode').empty().qrcode({
      width: 200,
      height: 200,
      text: res.link
    });
  }, function(msg) {
    alert(msg)
  })
})


//  左侧tab切换
$('.slide_tab > div').on('click', function() {
  var _this = this;
  $.each($('.tep_main > div'), function(k, v) {
    if ($(v).attr('data') == $(_this).attr('data')) {
      $(v).show().siblings().hide();
    }
  })
})

var history_page = 0;
var initHistoryTmp = {
  init: function() {
    this.initHistory();
    this.autoCompute();
    this.bindOnce();
    this.prevPage();
    this.nextPage();
  },
  prevPage: function(page) {
    $('.history_list .prev').on('click', function() {
      initHistoryTmp.initHistory(--history_page)
    })
  },
  nextPage: function(page) {
    $('.history_list .next').on('click', function() {
      initHistoryTmp.initHistory(++history_page);
    })
  },
  initHistory: function(page) {
    if (page && page <= 0) {
      return alert('前面没有了噢')
    }
    if (page && page > Math.floor($('#history_list_count').text() / 20)) {
      return alert('后面没有更多了噢')
    }
    utils.fetch('/page/preview?page=' + page, 'get', '', function(res) {
      $('#history_list_count').text(res.count)
      var str = '';
      $.each(res.lists, function(k, v) {
        str += '<li data-id="' + v._id + '"> <span >' + v.name + '</span> <span>' + new Date(v.create_time || '1970-01-01').Format("yyyy-MM-dd hh:mm:ss") + '</span> </li>'
      })
      $('#history_list_content').html(str);
    }, function(msg) {
      alert(msg)
    })
  },
  bindOnce: function() {
    $('#history_list_content').on('click', 'li', function() {
      var _id = $(this).attr('data-id')
      utils.fetch('/page/preview?id=' + _id, 'get', '', function(res) {
        window.history.pushState(null, null, '?id=' + res.id);
        $('#pageTitle').val(res.name);
        $('.view_content').html(res.content)
      })
    })
  },
  autoCompute: function() {
    var h = $(window).height() - $('.header').height() - 60 + 'px';
    $('.history_list').css({
      height: h,
      overflowY: 'scroll'
    })
  }
}
initHistoryTmp.init();

var component_page = 0;
var initComponentTmp = {
  init: function() {
    this.initHistory();
    this.autoCompute();
    this.bindOnce();
    this.prevPage();
    this.nextPage();
    this.removeCmp()
  },
  removeCmp: function() {
    $('.tep_main').on('click', 'span.remove', function(e) {
      console.log(e)
      e.stopPropagation();
      var _id = $(this).attr('data-id');
      utils.fetch('/components/delete', 'post', {
        id: _id
      }, function(res) {
        initComponentTmp.initHistory();
      }, function(res) {
        alert(res.msg)
      })

      return false
    })
  },
  prevPage: function(page) {
    $('.components_list .prev').on('click', function() {
      console.log(this, 11)
      initComponentTmp.initHistory(--component_page)
    })
  },
  nextPage: function(page) {
    $('.components_list .next').on('click', function() {
      initComponentTmp.initHistory(++component_page);
    })
  },
  initHistory: function(page) {
    if (page && page <= 0) {
      return alert('前面没有了噢')
    }
    if (page && page > Math.floor($('#components_list_count').text() / 30)) {
      return alert('后面没有更多了噢')
    }
    utils.fetch('/components/get?page=' + page, 'get', '', function(res) {
      $('#components_list_count').text(res.count)
      var str = '';
      $.each(res.lists, function(k, v) {
        str += '<li data-id="' + v._id + '"> <span >' + v.name + '</span> <div><span class="label label-info">' + v.category + '</span> <span auth="delcomp" class="label label-danger remove" data-id="' + v._id + '">删除</span></div></li>'
      })
      $('#components_list_content').html(str);
    }, function(msg) {
      alert(msg)
    })
  },
  bindOnce: function() {
    $('#components_list_content').on('click', 'li', function(e) {
      var _id = $(this).attr('data-id')
      utils.fetch('/components/get?id=' + _id, 'get', '', function(res) {
        $('.view_content').html(res.content)
      })
    })
  },
  autoCompute: function() {
    var h = $(window).height() - $('.header').height() - 60 + 'px';
    $('.tmp_content,.components_list').css({
      height: h,
      overflowY: 'scroll'
    })
    $('.edit_content').css({
      height: $(window).height() - $('.header').height() + 'px',
      overflowY: 'scroll'
    })
  }
}
initComponentTmp.init();

var image_page = 0;
var initImagesTmp = {
  init: function() {
    this.initHistory();
    this.autoCompute();
    // this.bindOnce();
    this.prevPage();
    this.nextPage();
    this.removeCmp();
    this.replaceUrl();
  },
  replaceUrl: function() {
    $('#images_list_content').on('click', 'li', function() {
      if (!lastTarget || lastTarget && lastTarget[0].nodeName !== 'IMG') {
        return
      }
      $(lastTarget).attr('src', $(this).find('img').attr('src'))
    })
  },
  removeCmp: function() {
    $('.tep_main').on('click', 'span.remove', function(e) {
      console.log(e)
      e.stopPropagation();
      var _id = $(this).attr('data-id');
      utils.fetch('/images/delete', 'post', {
        id: _id
      }, function(res) {
        initComponentTmp.initHistory();
      }, function(res) {
        alert(res.msg)
      })
      return false
    })
  },
  prevPage: function(page) {
    $('.images_list .prev').on('click', function() {
      console.log(this, 11)
      initImagesTmp.initHistory(--image_page)
    })
  },
  nextPage: function(page) {
    $('.images_list .next').on('click', function() {
      initImagesTmp.initHistory(++image_page);
    })
  },
  initHistory: function(page) {
    if (page && page <= 0) {
      return alert('前面没有了噢')
    }
    if (page && page > Math.floor($('#images_list_count').text() / 30)) {
      return alert('后面没有更多了噢')
    }
    utils.fetch('/file/get?page=' + page, 'get', '', function(res) {
      $('#images_list_count').text(res.count)
      var str = '';
      $.each(res.lists, function(k, v) {
        str += '<li><div class="img_box" style="height:100px">' +
          '<img src="' + v.url + '" alt="' + v.name + '">' +
          '</div>' +
          '<div>' +
          '<span>' + v.name + '</span>' +
          '</div>' +
          '</li>'
      })
      $('#images_list_content').html(str);
    }, function(msg) {
      alert(msg)
    })
  },
  bindOnce: function() {
    $('#images_list_content').on('click', 'li', function(e) {
      var _id = $(this).attr('data-id')
      utils.fetch('/images/get?id=' + _id, 'get', '', function(res) {
        $('.view_content').html(res.content)
      })
    })
  },
  autoCompute: function() {
    var h = $(window).height() - $('.header').height() - 60 + 'px';
    $('.tmp_content,.images_list').css({
      height: h,
      overflowY: 'scroll'
    })
    $('.edit_content').css({
      height: $(window).height() - $('.header').height() + 'px',
      overflowY: 'scroll'
    })

  }
}
initImagesTmp.init();
