<template>
  <div>
    <div class="block">
      <p>-------录制-------</p>
      <div>
        <button @click="go('rec')">录像页</button>
        <button @click="go('screen')">录屏页</button>
      </div>
    </div>
    <div class="block">
      <p>-------拍照-------</p>
      <button @click="go('takePicture')">拍照页</button>
    </div>
    <div class="block">
      <p>-------p2p-------</p>
      <button @click="go('robot')">被监控页</button>
      <button @click="go('receiver')">监控页</button>
    </div>
  </div>
</template>
<script>
export default {
  methods: {
    go (name) {
      this.$router.push({ name })
    }
  }
}
</script>
