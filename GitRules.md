# `jeongmyeong_client` Git 규칙

## 1) 저장소 역할
- `origin`: `https://github.com/leeminjun1/jeongmyeong_client.git` (내 작업 저장소)
- `upstream`: `https://github.com/JeongMyeongDev/jeongmyeong_client.git` (원본 저장소)
- 일상적인 작업 결과는 모두 `origin`에 푸시한다.
- 브랜치 이력을 맞추기 위해 `upstream`을 주기적으로 동기화한다.

## 2) 브랜치 전략 (간단 Git Flow)
- `main`
  - 항상 배포 가능한 안정 상태를 유지한다.
  - 직접 커밋하지 않는다.
- `develop`
  - 다음 배포를 위한 통합 브랜치다.
  - 기능 브랜치는 우선 여기로 머지한다.
- `feature/*`
  - 신규 기능 작업용이며 `develop`에서 분기한다.
  - 예시: `feature/auth-login-ui`
- `fix/*`
  - 긴급하지 않은 버그 수정용이며 `develop`에서 분기한다.
  - 예시: `fix/navbar-overlap`
- `release/*`
  - 릴리즈 준비용이며 `develop`에서 분기한다.
  - 예시: `release/0.1.0`
- `hotfix/*`
  - 운영 이슈 긴급 수정용이며 `main`에서 분기한다.
  - 예시: `hotfix/0.1.1`

## 3) 표준 작업 흐름
1. 메인 라인 동기화:
   - `git fetch upstream`
   - `git checkout main`
   - `git merge --ff-only upstream/main`
   - `git push origin main`
2. 통합 브랜치 최신화:
   - `git checkout develop`
   - `git merge --ff-only main`
   - `git push origin develop`
3. 기능 작업 시작:
   - `git checkout -b feature/<name> develop`
4. PR 열기 전 필수 점검:
   - `npm run lint`
   - `npm run build`
5. PR 생성:
   - `feature/*` 또는 `fix/*` -> `develop`
6. 릴리즈:
   - `develop`에서 `release/x.y.z` 생성
   - 최종 점검, 버전 업데이트, 변경 이력 정리
   - `release/x.y.z` -> `main` 머지 후 `vX.Y.Z` 태그 생성
   - `main` -> `develop` 역머지(back-merge)
7. 핫픽스:
   - `main`에서 `hotfix/x.y.z` 생성
   - `main`에 머지 후 패치 릴리즈 태그 생성
   - `main` -> `develop` 역머지(back-merge)

## 4) 커밋 메시지 규칙
- Conventional Commits 형식을 따른다:
  - `feat: add login form validation`
  - `fix: prevent header overlap on mobile`
  - `chore: update eslint config`
  - `refactor: split api client module`
  - `docs: add setup guide`

## 5) Pull Request 규칙
- PR은 작고 목적이 명확하게 유지한다.
- PR 하나에는 하나의 목적만 담는다.
- PR 본문에 아래 항목을 포함한다:
  - 요약 설명
  - 테스트 내용
  - UI 변경 시 스크린샷
- `feature/*`, `fix/*`는 squash merge를 우선 사용한다.
- lint/build 실패 시 머지하지 않는다.

## 6) 안전 규칙
- 공유 브랜치(`main`, `develop`)에는 force-push를 금지한다.
- 공유 브랜치에 푸시된 이력은 재작성하지 않는다.
- 공유 이력의 롤백은 `git revert`를 사용한다 (`reset/rebase` 지양).

## 7) Upstream 동기화 주기
- 최소 기준: 새 브랜치를 시작하기 전에 `upstream/main` 동기화
- 권장 기준: 활발한 개발 기간에는 하루 1회 이상 동기화

## 8) 1회성 초기 설정 명령어 (필요 시)
```bash
git remote -v
git fetch upstream
git checkout -b develop main
git push -u origin develop
```
