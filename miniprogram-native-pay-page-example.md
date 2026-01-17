# 微信小程序原生支付页面实现

WebView 中的 H5 会通过 `wx.miniProgram.navigateTo` 跳转到 `/pages/pay/index` 页面来完成支付。你需要在小程序中实现这个页面。

## 1. 在 app.json 中注册页面

```json
{
  "pages": [
    "pages/index/index",
    "pages/pay/index"
  ]
}
```

## 2. 创建 pages/pay/index.js

```javascript
Page({
  data: {
    orderNo: '',
    status: 'loading', // loading | paying | success | fail
    message: ''
  },

  onLoad(options) {
    console.log('[PayPage] onLoad', options);
    
    const { orderNo, params, callback } = options;
    
    if (!orderNo || !params) {
      this.setData({
        status: 'fail',
        message: '支付参数缺失'
      });
      return;
    }

    this.orderNo = orderNo;
    this.callbackUrl = callback ? decodeURIComponent(callback) : '';

    try {
      // 解析支付参数
      const payParams = JSON.parse(decodeURIComponent(params));
      console.log('[PayPage] payParams:', payParams);

      this.setData({
        orderNo: orderNo,
        status: 'paying'
      });

      // 调用微信支付
      this.requestPayment(payParams);
    } catch (e) {
      console.error('[PayPage] 解析参数失败:', e);
      this.setData({
        status: 'fail',
        message: '支付参数解析失败'
      });
    }
  },

  requestPayment(payParams) {
    wx.requestPayment({
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType || 'RSA',
      paySign: payParams.paySign,
      success: (res) => {
        console.log('[PayPage] 支付成功:', res);
        this.setData({
          status: 'success',
          message: '支付成功'
        });
        // 跳转回 WebView
        this.navigateBackToWebView(true);
      },
      fail: (err) => {
        console.error('[PayPage] 支付失败:', err);
        // 用户取消不算错误
        if (err.errMsg && err.errMsg.includes('cancel')) {
          this.setData({
            status: 'fail',
            message: '已取消支付'
          });
        } else {
          this.setData({
            status: 'fail',
            message: '支付失败: ' + (err.errMsg || '未知错误')
          });
        }
        // 返回 WebView（不带成功标记）
        setTimeout(() => {
          this.navigateBackToWebView(false);
        }, 1500);
      }
    });
  },

  navigateBackToWebView(success) {
    // 返回上一个 WebView 页面
    // 如果有 callback URL，则替换 WebView 的 src
    if (success && this.callbackUrl) {
      // 构建带成功参数的 URL
      let url = this.callbackUrl;
      if (!url.includes('payment_success=1')) {
        const separator = url.includes('?') ? '&' : '?';
        url = url + separator + 'payment_success=1&order=' + this.orderNo;
      }
      
      // 方式1: 尝试替换 WebView src（需要特定页面结构）
      // 方式2: 直接返回上一页，让 H5 检测轮询结果
      wx.navigateBack({
        delta: 1,
        fail: () => {
          // 如果无法返回，则跳转到首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });
    } else {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });
    }
  },

  // 用户点击重试
  onRetry() {
    wx.navigateBack({ delta: 1 });
  }
});
```

## 3. 创建 pages/pay/index.wxml

```xml
<view class="container">
  <view wx:if="{{status === 'loading'}}" class="loading">
    <text>加载中...</text>
  </view>

  <view wx:elif="{{status === 'paying'}}" class="paying">
    <text class="title">正在发起支付</text>
    <text class="subtitle">订单号: {{orderNo}}</text>
    <text class="hint">请在弹出的支付窗口中完成支付</text>
  </view>

  <view wx:elif="{{status === 'success'}}" class="success">
    <text class="icon">✓</text>
    <text class="title">支付成功</text>
    <text class="hint">正在返回...</text>
  </view>

  <view wx:elif="{{status === 'fail'}}" class="fail">
    <text class="icon">✗</text>
    <text class="title">{{message || '支付失败'}}</text>
    <button class="retry-btn" bindtap="onRetry">返回重试</button>
  </view>
</view>
```

## 4. 创建 pages/pay/index.wxss

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;
  background: #f5f5f5;
}

.loading, .paying, .success, .fail {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
}

.success .icon {
  color: #07c160;
}

.fail .icon {
  color: #fa5151;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.hint {
  font-size: 26rpx;
  color: #999;
}

.retry-btn {
  margin-top: 60rpx;
  padding: 20rpx 80rpx;
  background: #07c160;
  color: white;
  border-radius: 8rpx;
  font-size: 32rpx;
}
```

## 5. 创建 pages/pay/index.json

```json
{
  "navigationBarTitleText": "支付",
  "disableScroll": true
}
```

## 注意事项

1. **appId 一致性**: 确保 `create-wechat-order` 使用的 `appId` 和小程序的 `appId` 一致
2. **参数编码**: URL 参数已经过 `encodeURIComponent`，需要 `decodeURIComponent` 解码
3. **支付回调**: 支付成功后，返回 WebView，H5 通过订单轮询检测支付状态

## 调试建议

1. 在小程序开发者工具中查看 console 日志
2. 确认 `wx.requestPayment` 的参数格式正确
3. 如果提示 "requestPayment:fail"，检查：
   - 参数签名是否正确
   - 商户号配置是否正确
   - appId 是否与支付配置一致
