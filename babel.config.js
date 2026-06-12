module.exports = function (api) {
    api.cache(true);
    
    const plugins = [];
    
    // 💡 當處於生產/打包環境時，自動拔除所有的 console.log / console.info 等
    if (process.env.NODE_ENV === 'production') {
      plugins.push('transform-remove-console');
    }
  
    return {
      presets: ['babel-preset-expo'],
      plugins: plugins,
    };
  };