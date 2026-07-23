<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <ModalOverlay @close="emit('close')">
    <h3>あそびかたルール</h3>
    <div class="sub">カイルンBINGOのルール説明</div>
    <div class="rule-block">
      <h4>カイルンしたら貯金箱に投入</h4>
      <table>
        <tbody>
          <tr>
            <td>単発</td>
            <td>100円</td>
          </tr>
          <tr>
            <td>2連</td>
            <td>300円</td>
          </tr>
          <tr>
            <td>3連</td>
            <td>500円</td>
          </tr>
          <tr>
            <td>4連以上</td>
            <td>連発回数 × 200円</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="rule-block">
      <h4>サイコロを振ったらビンゴカードに穴を開ける</h4>
      <ul>
        <li>サイコロの出目の番号が自分のビンゴカードにあれば、そのマスに穴を開ける</li>
      </ul>
      <p class="warning">※罰金ありでプレイしている場合の罰金によるサイコロの出目はカウントしません。</p>
    </div>
    <div class="rule-block">
      <h4>ビンゴしたら</h4>
      <ul>
        <li>おめでとうございます！貯金箱の中身、全部持ってって！</li>
      </ul>
    </div>
    <button class="btn btn-primary modal-close" @click="emit('close')">閉じる</button>
  </ModalOverlay>
</template>
