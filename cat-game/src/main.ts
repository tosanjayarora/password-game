import Vue from 'vue'
import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { BootstrapVue } from "bootstrap-vue"
import appSettings from "../appsettings.json"
import App from './App.vue'

Vue.config.productionTip = false

const appInsights = new ApplicationInsights({ config: {
  instrumentationKey: appSettings.appInsightsInstrumentationKey
} });
appInsights.loadAppInsights();
appInsights.trackPageView();

Vue.use(BootstrapVue);

new Vue({
  render: h => h(App),
}).$mount('#app')
