<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app',
  mounted () {
    this.$router.push({ name: 'home' })
  }
}
</script>
<style>
.block {
  margin-bottom: 35px;
  border-bottom: 2px dashed #eee;
  padding-bottom: 25px;
}
</style>