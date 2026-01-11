/**
 * 微信小程序端支付处理示例代码
 * 
 * 📌 使用说明：
 * 1. 将此文件内容复制到你的小程序项目中
 * 2. 在 web-view 页面中监听 H5 发来的消息
 * 3. 调用 wx.requestPayment 完成支付
 * 
 * 🔔 注意事项：
 * - 小程序需要在微信支付后台配置支付权限
 * - 需要服务端返回小程序支付参数（而非 H5 支付参数）
 */

// ============= pages/webview/index.js =============
// 这是小程序中嵌入 H5 的 web-view 页面

Page({
  data: {
    webviewUrl: 'https://your-h5-domain.com',
    pendingPayment: null,
  },

  /**
   * 监听 web-view 发来的消息
   * H5 页面通过 wx.miniProgram.postMessage 发送消息
   * 
   * ⚠️ 重要：bindmessage 只在特定时机触发：
   * - 小程序后退、组件销毁、分享时
   * - 建议使用 navigateTo 跳转到支付页面来触发消息
   */
  onMessage(e) {
    console.log('收到 H5 消息:', e.detail);
    
    const messages = e.detail.data || [];
    
    // 处理最新的支付请求
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === 'PAYMENT_REQUEST') {
        this.handlePaymentRequest(msg);
        break;
      }
    }
  },

  /**
   * 处理支付请求
   */
  async handlePaymentRequest(request) {
    console.log('处理支付请求:', request);
    
    const { orderNo, amount, packageName, packageKey, userId } = request;
    
    try {
      // 1. 调用后端获取小程序支付参数
      const paymentParams = await this.getPaymentParams({
        orderNo,
        amount,
        packageKey,
        userId,
      });

      // 2. 调起微信支付
      await this.callWechatPay(paymentParams);

      // 3. 支付成功，返回 H5 页面
      wx.showToast({ title: '支付成功', icon: 'success' });
      
      // 可以通过 URL 参数通知 H5 支付结果
      this.setData({
        webviewUrl: `https://your-h5-domain.com/packages?order=${orderNo}&status=success`,
      });

    } catch (error) {
      console.error('支付失败:', error);
      wx.showToast({ title: error.message || '支付失败', icon: 'none' });
    }
  },

  /**
   * 调用后端获取小程序支付参数
   * 需要返回 wx.requestPayment 所需的参数
   */
  async getPaymentParams({ orderNo, amount, packageKey, userId }) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://your-api-domain.com/api/create-miniprogram-order',
        method: 'POST',
        data: {
          orderNo,
          amount,
          packageKey,
          userId,
          // 小程序支付需要 openid
          openId: wx.getStorageSync('openId'),
        },
        success: (res) => {
          if (res.data.success) {
            resolve(res.data.paymentParams);
          } else {
            reject(new Error(res.data.error || '获取支付参数失败'));
          }
        },
        fail: (err) => {
          reject(new Error('网络请求失败'));
        },
      });
    });
  },

  /**
   * 调起微信支付
   */
  async callWechatPay(params) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: params.timeStamp,
        nonceStr: params.nonceStr,
        package: params.package,        // 格式：prepay_id=xxx
        signType: params.signType || 'RSA',
        paySign: params.paySign,
        success: () => {
          resolve();
        },
        fail: (err) => {
          if (err.errMsg.includes('cancel')) {
            reject(new Error('用户取消支付'));
          } else {
            reject(new Error('支付失败: ' + err.errMsg));
          }
        },
      });
    });
  },
});


// ============= pages/webview/index.wxml =============
/*
<web-view 
  src="{{webviewUrl}}" 
  bindmessage="onMessage"
  bindload="onWebviewLoad"
  binderror="onWebviewError"
/>
*/


// ============= pages/payment/index.js =============
// 这是小程序原生支付页面（备选方案）
// 当 H5 跳转到此页面时，直接发起支付

Page({
  data: {
    orderNo: '',
    amount: 0,
    packageName: '',
    loading: true,
    error: null,
  },

  onLoad(options) {
    console.log('支付页面参数:', options);
    
    this.setData({
      orderNo: options.orderNo || '',
      amount: parseFloat(options.amount) || 0,
      packageName: options.packageName || '',
    });

    // 自动发起支付
    this.initiatePayment(options);
  },

  async initiatePayment(options) {
    try {
      this.setData({ loading: true, error: null });

      // 获取支付参数
      const paymentParams = await this.getPaymentParams({
        orderNo: options.orderNo,
        amount: parseFloat(options.amount),
        packageKey: options.packageKey,
      });

      // 调起支付
      await this.callWechatPay(paymentParams);

      // 支付成功
      wx.showToast({ title: '支付成功', icon: 'success' });
      
      // 返回 H5 页面
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      this.setData({ loading: false, error: error.message });
      wx.showToast({ title: error.message || '支付失败', icon: 'none' });
    }
  },

  async getPaymentParams({ orderNo, amount, packageKey }) {
    // 同上，调用后端 API
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://your-api-domain.com/api/create-miniprogram-order',
        method: 'POST',
        data: { orderNo, amount, packageKey },
        success: (res) => {
          if (res.data.success) {
            resolve(res.data.paymentParams);
          } else {
            reject(new Error(res.data.error));
          }
        },
        fail: () => reject(new Error('网络错误')),
      });
    });
  },

  callWechatPay(params) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        ...params,
        success: resolve,
        fail: (err) => reject(new Error(err.errMsg.includes('cancel') ? '用户取消' : '支付失败')),
      });
    });
  },

  // 重试支付
  onRetry() {
    this.initiatePayment(this.data);
  },

  // 返回
  onBack() {
    wx.navigateBack();
  },
});


// ============= pages/payment/index.wxml =============
/*
<view class="payment-page">
  <view class="order-info">
    <text class="label">商品：</text>
    <text class="value">{{packageName}}</text>
  </view>
  <view class="order-info">
    <text class="label">金额：</text>
    <text class="value price">¥{{amount}}</text>
  </view>
  
  <view wx:if="{{loading}}" class="loading">
    <text>正在调起支付...</text>
  </view>
  
  <view wx:if="{{error}}" class="error">
    <text>{{error}}</text>
    <button bindtap="onRetry">重试</button>
    <button bindtap="onBack">返回</button>
  </view>
</view>
*/
