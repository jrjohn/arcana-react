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
                    # Keep only last 3 build-tagged images for this app
                    docker images --format '{{.Repository}}:{{.Tag}}' \
                        | grep "${APP_NAME}.*build-" \
                        | sort -t- -k2 -rn \
                        | tail -n +4 \
                        | xargs -r docker rmi 2>/dev/null || true
                    # Drop the stale static :VERSION tag left by the previous build.
                    # Only build-* tags are pruned above; :1.0.0 otherwise persists in
                    # the containerd image store and the next compose build's export to
                    # the same name intermittently fails with "image already exists".
                    docker rmi -f "${IMAGE_TAG}:${VERSION}" 2>/dev/null || true
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
                // The container name is namespaced per ${BUILD_NUMBER} (same pattern as
                // the Architecture Qube stage) so concurrent builds on the shared host
                // daemon don't collide on a static "react-app-test" name.
                sh '''
                    C=react-app-test-${BUILD_NUMBER}
                    docker rm -f "$C" 2>/dev/null || true
                    set +e
                    docker compose -f docker-compose.test.yml run --build --name "$C" test
                    rc=$?
                    set -e
                    rm -rf coverage && mkdir -p coverage
                    docker cp "$C":/app/coverage/. coverage/ || true
                    docker rm -f "$C" 2>/dev/null || true
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
                        // Parsed with grep/cut (no jq — the built-in agent's sh lacks it).
                        sh '''
                            set -e
                            TOKEN="${SONAR_AUTH_TOKEN:-$SONAR_TOKEN}"
                            RT=.scannerwork/report-task.txt
                            [ -f "$RT" ] || { echo "report-task.txt missing"; exit 1; }
                            CE_TASK_ID=$(grep '^ceTaskId=' "$RT" | cut -d= -f2-)
                            ANALYSIS_ID=""
                            for i in $(seq 1 60); do
                                RESP=$(curl -s -u "$TOKEN:" "$SONAR_HOST_URL/api/ce/task?id=$CE_TASK_ID")
                                ST=$(echo "$RESP" | grep -o '"status":"[A-Z_]*"' | head -1 | cut -d'"' -f4)
                                echo "  CE status: ${ST:-?} (try $i)"
                                if [ "$ST" = "SUCCESS" ]; then ANALYSIS_ID=$(echo "$RESP" | grep -o '"analysisId":"[^"]*"' | head -1 | cut -d'"' -f4); break;
                                elif [ "$ST" = "FAILED" ] || [ "$ST" = "CANCELED" ]; then echo "CE $ST"; exit 1; fi
                                sleep 5
                            done
                            [ -n "$ANALYSIS_ID" ] || { echo "CE timeout"; exit 1; }
                            GATE=$(curl -s -u "$TOKEN:" "$SONAR_HOST_URL/api/qualitygates/project_status?analysisId=$ANALYSIS_ID")
                            GST=$(echo "$GATE" | grep -o '"status":"[A-Z]*"' | head -1 | cut -d'"' -f4)
                            echo "Quality gate: ${GST:-UNKNOWN}"
                            if [ "$GST" != "OK" ]; then echo "$GATE"; exit 1; fi
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
                        --ci --format json,markdown -o /output --threshold 90 || exit 1
                    tar --exclude=./.git --exclude=./node_modules --exclude=./dist --exclude=./coverage --exclude=./arch-qube-reports -C . -cf - . \
                        | docker cp - "$C":/src || exit 1
                    docker start -a "$C"
                    rc=$?
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
