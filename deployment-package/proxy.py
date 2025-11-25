#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信API代理服务器 - Python/Flask 版本
用于转发微信公众号请求到 Supabase Edge Functions
"""

import os
import time
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 配置
PORT = int(os.getenv('PORT', 3000))
PROXY_AUTH_TOKEN = os.getenv('PROXY_AUTH_TOKEN')
EDGE_FUNCTION_URL = os.getenv('EDGE_FUNCTION_URL', '')

# 日志函数
def log(message):
    timestamp = datetime.now().isoformat()
    print(f'[{timestamp}] {message}')

# 请求日志中间件
@app.before_request
def log_request():
    log(f'{request.method} {request.path}')

# 健康检查端点
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'server': 'WeChat API Proxy (Python/Flask)',
        'version': '1.0.0',
        'uptime': time.process_time()
    })

# 微信回调端点 - GET (URL验证)
@app.route('/wechat-callback', methods=['GET'])
def wechat_callback_get():
    try:
        # 获取微信验证参数
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echostr = request.args.get('echostr', '')
        
        log(f'微信URL验证请求: signature={signature}, timestamp={timestamp}, nonce={nonce}')
        
        if not EDGE_FUNCTION_URL:
            log('错误: EDGE_FUNCTION_URL 未配置')
            return jsonify({'error': 'EDGE_FUNCTION_URL not configured'}), 500
        
        # 转发到 Edge Function
        target_url = f'{EDGE_FUNCTION_URL}?signature={signature}&timestamp={timestamp}&nonce={nonce}&echostr={echostr}'
        log(f'转发验证请求到: {target_url}')
        
        response = requests.get(target_url, timeout=10)
        log(f'Edge Function 响应状态: {response.status_code}')
        
        # 返回 echostr 完成验证
        return Response(response.text, status=response.status_code, mimetype='text/plain')
        
    except Exception as e:
        log(f'URL验证错误: {str(e)}')
        return jsonify({'error': f'URL validation failed: {str(e)}'}), 500

# 微信回调端点 - POST (接收消息)
@app.route('/wechat-callback', methods=['POST'])
def wechat_callback_post():
    try:
        # 获取请求参数
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        openid = request.args.get('openid', '')
        encrypt_type = request.args.get('encrypt_type', '')
        msg_signature = request.args.get('msg_signature', '')
        
        # 获取原始请求体（XML）
        body = request.get_data(as_text=True)
        
        log(f'接收微信消息: openid={openid}, encrypt_type={encrypt_type}')
        
        if not EDGE_FUNCTION_URL:
            log('错误: EDGE_FUNCTION_URL 未配置')
            return jsonify({'error': 'EDGE_FUNCTION_URL not configured'}), 500
        
        # 构建转发URL
        params = []
        if signature:
            params.append(f'signature={signature}')
        if timestamp:
            params.append(f'timestamp={timestamp}')
        if nonce:
            params.append(f'nonce={nonce}')
        if openid:
            params.append(f'openid={openid}')
        if encrypt_type:
            params.append(f'encrypt_type={encrypt_type}')
        if msg_signature:
            params.append(f'msg_signature={msg_signature}')
        
        target_url = f'{EDGE_FUNCTION_URL}?{"&".join(params)}'
        log(f'转发消息到: {target_url}')
        
        # 转发请求
        headers = {
            'Content-Type': 'application/xml',
        }
        
        response = requests.post(
            target_url,
            data=body.encode('utf-8'),
            headers=headers,
            timeout=30
        )
        
        log(f'Edge Function 响应状态: {response.status_code}')
        
        # 返回 Edge Function 的响应
        return Response(
            response.content,
            status=response.status_code,
            mimetype='application/xml'
        )
        
    except Exception as e:
        log(f'消息处理错误: {str(e)}')
        return jsonify({'error': f'Message processing failed: {str(e)}'}), 500

# 微信API代理端点
@app.route('/wechat-proxy', methods=['POST'])
def wechat_proxy():
    try:
        # 验证认证令牌
        if PROXY_AUTH_TOKEN:
            auth_header = request.headers.get('Authorization', '')
            token = auth_header.replace('Bearer ', '')
            
            if token != PROXY_AUTH_TOKEN:
                log('未授权访问尝试')
                return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        target_url = data.get('target_url')
        method = data.get('method', 'GET')
        headers = data.get('headers', {})
        body = data.get('body')
        
        if not target_url:
            return jsonify({'error': 'target_url is required'}), 400
        
        log(f'代理请求 {method} {target_url}')
        
        # 准备请求
        request_headers = {
            'Content-Type': 'application/json',
            **headers
        }
        
        # 发送请求
        if method.upper() in ['POST', 'PUT', 'PATCH']:
            response = requests.request(
                method,
                target_url,
                json=body,
                headers=request_headers,
                timeout=30
            )
        else:
            response = requests.request(
                method,
                target_url,
                headers=request_headers,
                timeout=30
            )
        
        log(f'响应状态: {response.status_code}')
        
        # 返回响应
        try:
            return jsonify(response.json()), response.status_code
        except:
            return Response(response.text, status=response.status_code)
            
    except Exception as e:
        log(f'代理错误: {str(e)}')
        return jsonify({
            'error': 'Proxy request failed',
            'message': str(e)
        }), 500

# 404 处理
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

# 错误处理
@app.errorhandler(Exception)
def handle_error(e):
    log(f'错误: {str(e)}')
    return jsonify({'error': 'Internal server error'}), 500

# 启动服务器
if __name__ == '__main__':
    print('=' * 60)
    print('微信API代理服务器 (Python/Flask)')
    print('=' * 60)
    print(f'状态: 运行在端口 {PORT}')
    print(f'健康检查: http://localhost:{PORT}/health')
    print(f'代理端点: http://localhost:{PORT}/wechat-proxy')
    print(f'微信回调: http://localhost:{PORT}/wechat-callback')
    print(f'认证: {"已启用" if PROXY_AUTH_TOKEN else "已禁用 (⚠️  不安全!)"}')
    print(f'Edge Function: {EDGE_FUNCTION_URL or "未配置"}')
    print(f'启动时间: {datetime.now().isoformat()}')
    print('=' * 60)
    
    # 生产环境使用 gunicorn，开发环境使用 Flask 内置服务器
    app.run(host='0.0.0.0', port=PORT, debug=False)
