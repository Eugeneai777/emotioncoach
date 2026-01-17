# 微信小程序原生支付页面实现

WebView 中的 H5 会通过 `wx.miniProgram.navigateTo` 跳转到 `/pages/pay/index` 页面来完成支付。

**新流程**：H5 只传递订单信息（packageKey, amount 等），由小程序原生端负责：
1. 调用 `wx.login` 获取 code
2. 通过代理服务器换取 openId
3. 调用边缘函数创建订单
4. 调用 `wx.requestPayment` 完成支付

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
// 代理服务器地址（用于获取 openId）
const PROXY_SERVER = 'https://wechat.eugenewe.net';
// Supabase Edge Function 地址
const SUPABASE_FUNCTIONS_URL = 'https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1';

Page({
  data: {
    status: 'loading', // loading | creating | paying | success | fail
    message: '',
    orderInfo: null
  },

  onLoad(options) {
    console.log('[PayPage] onLoad options:', options);
    
    const { orderInfo, callback } = options;
    
    if (!orderInfo) {
      this.setData({
        status: 'fail',
        message: '订单信息缺失'
      });
      return;
    }

    try {
      // 解析订单信息
      const info = JSON.parse(decodeURIComponent(orderInfo));
      console.log('[PayPage] orderInfo:', info);
      
      this.callbackUrl = callback ? decodeURIComponent(callback) : '';
      
      this.setData({
        orderInfo: info,
        status: 'loading',
        message: '正在准备支付...'
      });

      // 开始支付流程
      this.startPaymentFlow(info);
    } catch (e) {
      console.error('[PayPage] 解析参数失败:', e);
      this.setData({
        status: 'fail',
        message: '参数解析失败'
      });
    }
  },

  // 完整支付流程
  async startPaymentFlow(orderInfo) {
    try {
      // Step 1: 获取 wx.login code
      this.setData({ message: '正在获取授权...' });
      const code = await this.getLoginCode();
      console.log('[PayPage] got code:', code);

      // Step 2: 通过代理服务器获取 openId
      this.setData({ message: '正在验证身份...' });
      const openId = await this.getOpenId(code);
      console.log('[PayPage] got openId:', openId);

      // Step 3: 创建订单
      this.setData({ status: 'creating', message: '正在创建订单...' });
      const orderResult = await this.createOrder(orderInfo, openId);
      console.log('[PayPage] order created:', orderResult);

      if (!orderResult.success) {
        throw new Error(orderResult.message || '创建订单失败');
      }

      this.orderNo = orderResult.orderNo;

      // Step 4: 调用微信支付
      this.setData({ status: 'paying', message: '正在发起支付...' });
      await this.requestPayment(orderResult.miniprogramPayParams);

    } catch (error) {
      console.error('[PayPage] Payment flow error:', error);
      this.setData({
        status: 'fail',
        message: error.message || '支付失败'
      });
    }
  },

  // 获取 wx.login code
  getLoginCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code);
          } else {
            reject(new Error('获取登录凭证失败'));
          }
        },
        fail: (err) => {
          reject(new Error('微信登录失败: ' + err.errMsg));
        }
      });
    });
  },

  // 通过代理服务器获取 openId
  async getOpenId(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${PROXY_SERVER}/miniprogram-login`,
        method: 'POST',
        data: { code },
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          console.log('[PayPage] miniprogram-login response:', res);
          if (res.statusCode === 200 && res.data && res.data.openid) {
            resolve(res.data.openid);
          } else {
            reject(new Error(res.data?.error || '获取 openId 失败'));
          }
        },
        fail: (err) => {
          reject(new Error('网络请求失败: ' + err.errMsg));
        }
      });
    });
  },

  // 创建订单
  async createOrder(orderInfo, openId) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${SUPABASE_FUNCTIONS_URL}/create-wechat-order`,
        method: 'POST',
        data: {
          packageKey: orderInfo.packageKey,
          packageName: orderInfo.packageName,
          amount: orderInfo.amount,
          userId: orderInfo.userId || 'guest',
          payType: 'miniprogram',
          openId: openId
        },
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          console.log('[PayPage] create-wechat-order response:', res);
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            reject(new Error(res.data?.message || '创建订单失败'));
          }
        },
        fail: (err) => {
          reject(new Error('创建订单请求失败: ' + err.errMsg));
        }
      });
    });
  },

  // 调用微信支付
  requestPayment(payParams) {
    return new Promise((resolve, reject) => {
      console.log('[PayPage] requestPayment params:', payParams);
      
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
          // 延迟返回，让用户看到成功状态
          setTimeout(() => {
            this.navigateBackToWebView(true);
          }, 1000);
          resolve(res);
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
          // 返回 WebView
          setTimeout(() => {
            this.navigateBackToWebView(false);
          }, 1500);
          reject(err);
        }
      });
    });
  },

  navigateBackToWebView(success) {
    // 返回上一个 WebView 页面
    if (success && this.callbackUrl) {
      // 成功时：H5 会通过轮询检测订单状态
      // 也可以通过 URL 参数通知
      console.log('[PayPage] navigating back with success, orderNo:', this.orderNo);
    }
    
    wx.navigateBack({
      delta: 1,
      fail: () => {
        // 如果无法返回，则跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  },

  // 用户点击重试
  onRetry() {
    if (this.data.orderInfo) {
      this.startPaymentFlow(this.data.orderInfo);
    } else {
      wx.navigateBack({ delta: 1 });
    }
  }
});
```

## 3. 创建 pages/pay/index.wxml

```xml
<view class="container">
  <view wx:if="{{status === 'loading' || status === 'creating'}}" class="status-box loading">
    <view class="spinner"></view>
    <text class="title">{{message || '加载中...'}}</text>
  </view>

  <view wx:elif="{{status === 'paying'}}" class="status-box paying">
    <text class="title">正在发起支付</text>
    <text class="hint">请在弹出的支付窗口中完成支付</text>
  </view>

  <view wx:elif="{{status === 'success'}}" class="status-box success">
    <text class="icon">✓</text>
    <text class="title">支付成功</text>
    <text class="hint">正在返回...</text>
  </view>

  <view wx:elif="{{status === 'fail'}}" class="status-box fail">
    <text class="icon">✗</text>
    <text class="title">{{message || '支付失败'}}</text>
    <button class="retry-btn" bindtap="onRetry">重试</button>
    <button class="back-btn" bindtap="navigateBackToWebView">返回</button>
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
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
}

.status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60rpx;
  background: white;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  width: 80%;
  max-width: 600rpx;
}

.spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid #e9ecef;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 40rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.hint {
  font-size: 26rpx;
  color: #999;
  margin-top: 10rpx;
}

.retry-btn {
  margin-top: 40rpx;
  padding: 24rpx 80rpx;
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  color: white;
  border-radius: 48rpx;
  font-size: 32rpx;
  border: none;
}

.back-btn {
  margin-top: 20rpx;
  padding: 24rpx 80rpx;
  background: #f5f5f5;
  color: #666;
  border-radius: 48rpx;
  font-size: 32rpx;
  border: none;
}
```

## 5. 创建 pages/pay/index.json

```json
{
  "navigationBarTitleText": "支付",
  "disableScroll": true
}
```

## 重要配置

### 代理服务器 (wechat.eugenewe.net)

代理服务器需要有 `/miniprogram-login` 端点，代码示例：

```javascript
// proxy.js 中添加
app.post('/miniprogram-login', async (req, res) => {
  const { code } = req.body;
  
  const response = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_MINI_PROGRAM_APP_ID}&secret=${WECHAT_MINI_PROGRAM_APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  );
  
  const data = await response.json();
  res.json(data); // { openid, session_key, unionid? }
});
```

### 小程序配置

在小程序管理后台的「开发管理 → 服务器域名」中添加：

- **request 合法域名**:
  - `https://wechat.eugenewe.net`
  - `https://vlsuzskvykddwrxbmcbu.supabase.co`

## 调试建议

1. 在小程序开发者工具中打开「调试器」查看 console 日志
2. 检查每个步骤的返回值：
   - `wx.login` 是否成功获取 code
   - `/miniprogram-login` 是否返回 openid
   - `create-wechat-order` 是否返回 miniprogramPayParams
3. 如果 `wx.requestPayment` 失败，检查：
   - `timeStamp` 是否为字符串类型
   - `package` 格式是否正确（应为 `prepay_id=xxx`）
   - 签名是否正确

## H5 端调用方式

H5 通过以下方式跳转到原生支付页面：

```javascript
const orderInfo = {
  packageKey: 'wealth_assessment',
  packageName: '财富评估',
  amount: 9.9,
  userId: currentUserId || 'guest'
};

const encodedInfo = encodeURIComponent(JSON.stringify(orderInfo));
const callbackUrl = encodeURIComponent(window.location.href);

window.wx.miniProgram.navigateTo({
  url: `/pages/pay/index?orderInfo=${encodedInfo}&callback=${callbackUrl}`
});
```
