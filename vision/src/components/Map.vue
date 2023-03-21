<!-- 商家分布图表 -->
<template>
  <div class="com-container" @dblclick="revertMap">
    <div class="com-chart" ref="map_ref"></div>
  </div>
</template>
<script>
import axios from 'axios'
import { getProvinceMapInfo } from '@/utils/map_utils'
import { mapState } from 'vuex'
export default {
  data() {
    return {
      chartInstance: null,
      allData: null,
      mapData: {} // 所获取的省份的地图矢量数据
    }
  },
  created() {
    // 在组建创建完成之后，注册回调函数
    this.$socket.registerCallBack('mapData', this.getData)
  },
  mounted() {
    this.initChart()
    // this.getData()
    // 发送数据给服务器，告诉服务器，我现在需要数据
    this.$socket.send({
      action: 'getData',
      socketType: 'mapData',
      chartName: 'map',
      value: ''
    })
    window.addEventListener('resize', this.screenAdapter)
    // 屏幕加载完成，主动进行屏幕分辨率适配
    this.screenAdapter()
  },
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter)
    // 在组件销毁时，取消回调函数
    this.$socket.unRegisterCallBack('mapData')
  },
  methods: {
    async initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.map_ref, this.theme)
      // 获取中国地图的矢量数据
      // http://localhost:8999:static/map/china.json
      // 由于我们获取的地图数据不是位于 koa2 后台，所以不能使用 this.$http
      const { data: res } = await axios.get('http://localhost:8999/static/map/china.json')
      // console.log(res)
      this.$echarts.registerMap('china', res)
      const initOption = {
        title: {
          text: '▎商家分布',
          left: 20,
          top: 20
        },
        geo: {
          type: 'map',
          map: 'china',
          top: '5%',
          bottom: '5%',
          itemStyle: {
            areaColor: '#2E72BF',
            borderColor: '#333'
          }
        },
        // 图例
        legend: {
          left: '5%',
          bottom: '5%',
          orient: 'vertial' // 垂直分布
        }
      }
      this.chartInstance.setOption(initOption)
      this.chartInstance.on('click', async arg => {
        // arg.name 得到所点击的省份，这个省份是中文，需要转化为拼音
        const provinceInfo = getProvinceMapInfo(arg.name)
        // console.log(provinceInfo)
        // 需要获取这个省份的地图矢量数据
        // 若 this.mapData 中没有此条数据，就发请求
        if (!this.mapData[provinceInfo.key]) {
          const { data: res } = await axios.get('http://localhost:8999' + provinceInfo.path)
          this.mapData[provinceInfo.key] = res // 将获取的新数据添加到 mapData 数组中，目的是为了确保不重复发起请求，不重复注册地图
          this.$echarts.registerMap(provinceInfo.key, res)
        }
        const changeOption = {
          geo: {
            map: provinceInfo.key
          }
        }
        this.chartInstance.setOption(changeOption)
      })
    },
    getData(res) {
      // const { data: res } = await this.$http.get('map')
      this.allData = res
      // console.log(res)
      this.updateChart()
    },
    updateChart() {
      // 处理图标需要的数据
      const legendArr = this.allData.map(item => item.name)
      const seriesArr = this.allData.map(item => {
        // return 的这个对象就代表的是每一个类别下的所有散点数据
        return {
          type: 'effectScatter',
          rippleEffect: {
            scale: 5,
            brushType: 'stroke' // 波纹的绘制方式(stroke:空心   fill:实心（默认）)
          },
          name: item.name,
          data: item.children,
          coordinateSystem: 'geo'
        }
      })
      const dataOption = {
        series: seriesArr,
        // 图例
        legend: {
          data: legendArr
        }
      }
      this.chartInstance.setOption(dataOption)
    },
    screenAdapter() {
      const titleFontSize = (this.$refs.map_ref.offsetWidth / 100) * 3.6
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize
          }
        },
        legend: {
          itemWidth: titleFontSize / 2,
          itemHeight: titleFontSize / 2,
          itemGap: titleFontSize / 2, // 图例间隔
          textStyle: {
            fontSize: titleFontSize / 2
          }
        }
      }
      this.chartInstance.setOption(adapterOption)
      // 改变图表尺寸，在容器大小发生改变时需要手动调用。
      this.chartInstance.resize()
    },
    // 回到中国地图
    revertMap() {
      const revertOption = {
        geo: {
          map: 'china'
        }
      }
      this.chartInstance.setOption(revertOption)
    }
  },
  computed: {
    ...mapState(['theme'])
  },
  watch: {
    theme() {
      // console.log('主题切换了')
      this.chartInstance.dispose() // 销毁当前的图表
      this.initChart() // 重新以最新的主题名称初始化图表对象
      this.screenAdapter() // 完成屏幕的适配
      this.updateChart() // 更新图表的展示
    }
  }
}
</script>

<style></style>
