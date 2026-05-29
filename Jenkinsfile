// Jenkinsfile — multibranch pipeline for arcana-react
// Adapted from legacy react-app-pipeline XML config.
//
// Key differences from the legacy XML-embedded script:
//   * `checkout scm` (no hardcoded branch=main)        — supports every branch + every PR
//   * `pollSCM` trigger removed                        — Jenkins multibranch + GitHub webhook drive triggers
//   * `dir("${env.PROJECTS_DIR}/arcana-react")` blocks REMOVED — multibranch uses workspace root
//   * "Push to Registry" + "Arch Qube Metrics" gated   — only main pushes to registry; PR builds stay local
//   * SonarQube gets pullrequest.* params on PRs       — PR-decoration in Sonar UI

pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '1'))
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        APP_NAME  = "react-app"
        REGISTRY  = "localhost:5000"
        IMAGE_TAG = "${REGISTRY}/arcana/${APP_NAME}"
        VERSION   = "1.0.0"
    }

    stages {
        stage("Checkout") {
            steps {
                checkout scm
                sh 'git log -1 --oneline'
                script {
                    echo "Branch: ${env.BRANCH_NAME ?: 'unknown'}"
                    echo "PR: ${env.CHANGE_ID ?: 'no'} (target: ${env.CHANGE_TARGET ?: 'n/a'})"
                }
            }
        }

        stage("Cleanup Old Images") {
            steps {
                sh '''
                    # Remove dangling/unused images to free disk space
                    docker image prune -f || true
                    # Keep only last 3 build-tagged images for this app
                    docker images --format '{{.Repository}}:{{.Tag}}' \
                        | grep "${APP_NAME}.*build-" \
                        | sort -t- -k2 -rn \
                        | tail -n +4 \
                        | xargs -r docker rmi 2>/dev/null || true
                    # Stop leftover test containers
                    docker compose -f docker-compose.test.yml down \
                        --remove-orphans 2>/dev/null || true
                '''
            }
        }

        stage("Docker Compose Build") {
            steps {
                sh "VERSION=${VERSION} docker compose -f docker-compose.ci.yml build"
                sh "docker tag localhost:5000/arcana/${APP_NAME}:${VERSION} ${IMAGE_TAG}:build-${BUILD_NUMBER}"
            }
        }

        stage("Unit Tests") {
            steps {
                // Run tests in a NAMED (non --rm) container so coverage can be copied
                // back into the Jenkins workspace. A host bind-mount (- ./coverage:/output)
                // does NOT work here: Jenkins talks to the host daemon, so the mount
                // resolves to a stray host path the workspace can't read -> coverage 0.0.
                sh '''
                    docker rm -f react-app-test 2>/dev/null || true
                    set +e
                    docker compose -f docker-compose.test.yml run --build --name react-app-test test
                    rc=$?
                    set -e
                    rm -rf coverage && mkdir -p coverage
                    docker cp react-app-test:/app/coverage/. coverage/ || true
                    docker rm -f react-app-test 2>/dev/null || true
                    exit $rc
                '''
            }
        }

        stage("SonarQube Analysis") {
            steps {
                withSonarQubeEnv('SonarQube') {
                        // SonarQube Community Build rejects sonar.pullrequest.*
                        // (Developer Edition feature), so all branches run a plain
                        // scan without GitHub PR decoration.
                        sh """sonar-scanner \
                          -Dsonar.projectKey=react-app \
                          -Dsonar.projectName="React App" \
                          -Dsonar.sources=src \
                          -Dsonar.exclusions=node_modules/**,dist/** \
                          -Dsonar.scm.disabled=true \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info"""
                        // Real quality gate: poll the CE task to completion, then
                        // fail the build if the project's quality gate is not OK.
                        sh '''
                            CE_TASK=$(grep '^ceTaskId=' .scannerwork/report-task.txt | cut -d= -f2)
                            echo "ceTaskId=$CE_TASK"
                            ANALYSIS_ID=""
                            for i in $(seq 1 60); do
                                TASK_JSON=$(curl -fsS -u "${SONAR_AUTH_TOKEN:-$SONAR_TOKEN}:" "$SONAR_HOST_URL/api/ce/task?id=$CE_TASK")
                                STATUS=$(echo "$TASK_JSON" | jq -r .task.status)
                                if [ "$STATUS" = "SUCCESS" ]; then
                                    ANALYSIS_ID=$(echo "$TASK_JSON" | jq -r .task.analysisId); break
                                fi
                                if [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "CANCELED" ]; then
                                    echo "Sonar CE task $STATUS"; exit 1
                                fi
                                sleep 5
                            done
                            [ -n "$ANALYSIS_ID" ] || { echo "CE task did not finish in time"; exit 1; }
                            GATE=$(curl -fsS -u "${SONAR_AUTH_TOKEN:-$SONAR_TOKEN}:" "$SONAR_HOST_URL/api/qualitygates/project_status?analysisId=$ANALYSIS_ID" | jq -r .projectStatus.status)
                            echo "Quality Gate: $GATE"
                            [ "$GATE" = "OK" ] || { echo "Quality gate failed: $GATE"; exit 1; }
                        '''
                }
            }
        }

        stage("Architecture Qube") {
            steps {
                // Real blocking gate. The DinD bind mount (-v $(pwd):/project) does
                // NOT work: Jenkins talks to the host daemon, so $(pwd) resolves to a
                // stray host path and /project is empty. Instead create a container with
                // anonymous volumes, tar the workspace source INTO /src, run the scan,
                // and copy the report back out. --ci makes arch-qube exit 1 below 90.
                sh '''
                    mkdir -p arch-qube-reports
                    IMG=arcana.boo/arcana/arch-qube:latest
                    C=arcana-arch-qube-react-${BUILD_NUMBER}
                    docker rm -f "$C" 2>/dev/null || true
                    docker create --name "$C" --network devops_default \
                        -v /src -v /output \
                        "$IMG" scan /src --framework react --no-ai \
                        --ci --format json,markdown -o /output --threshold 90
                    tar --exclude=./.git --exclude=./node_modules --exclude=./dist --exclude=./coverage -C . -cf - . \
                        | docker cp - "$C":/src
                    set +e
                    docker start -a "$C"
                    rc=$?
                    set -e
                    docker cp "$C":/output/. arch-qube-reports/ 2>/dev/null || true
                    docker rm -f "$C" 2>/dev/null || true
                    exit $rc
                '''
            }
        }

        stage("Image Info") {
            steps {
                sh "docker images --format 'table {{.Repository}}:{{.Tag}}\\t{{.Size}}' | grep ${APP_NAME} || true"
            }
        }

        stage("Push to Registry") {
            // Only push from main branch builds. PR builds keep the image local
            // for tests but don't pollute the registry with PR tags.
            when { branch 'main' }
            steps {
                sh "docker push ${IMAGE_TAG}:${VERSION}"
                sh "docker push ${IMAGE_TAG}:build-${BUILD_NUMBER}"
            }
        }

        stage("Arch Qube Metrics") {
            // Metrics script writes to shared report dir, only run for main.
            when { branch 'main' }
            steps {
                catchError(buildResult: 'SUCCESS', stageResult: 'SUCCESS') {
                    sh "bash /data/projects/_scripts/arch-qube-metrics.sh \$(pwd) arcana-react || true"
                }
            }
        }
    }

    post {
        success { echo "Pipeline SUCCESS - ${APP_NAME}:${VERSION} branch=${env.BRANCH_NAME ?: '?'} pr=${env.CHANGE_ID ?: 'no'}" }
        failure { echo "Pipeline FAILED - branch=${env.BRANCH_NAME ?: '?'} pr=${env.CHANGE_ID ?: 'no'}" }
        always  { echo "Build number ${BUILD_NUMBER} done" }
    }
}
