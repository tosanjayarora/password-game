<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ChatService, User } from '@pwdgame/shared';
import appSettings from "../../appsettings.json";

@Component
export default class PhishedComponent extends Vue {
  private chatService: ChatService | null = null;
  private spamInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  @Prop({
    type: Object,
    required: true
  })
  readonly user?: User;

  readonly spamMessages = [
    "I love dogs! Woof! - This message brought to you by 1-800-DOGS",
    "Call 1-800-DOGS for the best dog treats in town!",
    "1-800-DOGS has the best dog treats and bones. Call today!",
    "Does your furry friend like treats? Call 1-800-DOGS to buy them some delicous treats.",
    "LIMITED TIME OFFER: Mention code 'GOOD DOG' for 25% savings at 1-800-DOGS",
    "Dogs rule! Call 1-800-DOGS today!"
  ];

  countdown = 10;
  redirected = false;

  mounted() {
    if (!this.chatService)
    {
      this.chatService = new ChatService(appSettings.backendApiBaseUrl);
      this.sendSpamMessage();
    }

    if (!this.spamInterval)
    {
      this.spamInterval = setInterval(() => this.sendSpamMessage(), 60000);
    }

    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0)
      {
        this.countdown--;
      }

      if (this.countdown <= 0) {
        this.redirected = true;
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
        }
        setTimeout(() => {
          this.$emit('redirect');
        }, 1000); // 1 second delay before redirect
      }
    }, 1000);
  }

  beforeDestroy() {
    if (this.spamInterval) {
      clearInterval(this.spamInterval);
      this.spamInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.chatService) {
      this.chatService.dispose();
      this.chatService = null;
    }
  }

  async sendSpamMessage() {
    if(!this.user) return;
    const randomMsgIdx = new Date().valueOf() % this.spamMessages.length;
    try {
      await this.chatService?.sendMessage({
        username: this.user.username,
        message: this.spamMessages[randomMsgIdx],
        avatarId: this.getRandomDogAvatarId()
      });
    } catch {
      return;
    }
  }

  getRandomDogAvatarId() {
    return [
      'dog1',
      'dog2',
      'dog3'
    ][new Date().valueOf() % 3];
  }
}
  </script>

<template>
  <div class="d-flex h-100 justify-content-center align-items-center">
    <div v-if="!redirected" class="alert alert-danger">
      <h4 class="alert-heading">Phishing simulation</h4>
      <p class="">Login succeeded, and this page is intentionally shown to demonstrate a phishing-style interruption.</p>
      <p class="pb-0">Redirecting you back to the chat game in {{countdown}} seconds...</p>
    </div>
  </div>
</template>
