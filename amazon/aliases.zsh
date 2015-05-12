alias bb="brazil-build"
alias bbc="brazil-build clean"
alias bcb="brazil-build clean && brazil-build"
alias b="brazil"
alias ionpp=/apollo/env/iopmtools/bin/ion-pretty-print #pretty prints output of the next two commands
alias g2s2="/apollo/env/iopmtools/bin/g2s2 -u  http://g2s2-repo-author-na.amazon.com/" #prod command
alias g2s2cr="/apollo/env/iopmtools/bin/g2s2-post-review -u http://g2s2-repo-author-na.amazon.com/" #Code Review
alias ns='ninja-search'
alias eclipse='eclipse &>/dev/null &'
alias dw='ssh fma-gamma-na-6001.iad6.amazon.com'
alias brazil-octane=/apollo/env/OctaneBrazilTools/bin/brazil-octane

tiny() {
    if (($# == 0)); then
        local in=$(</dev/stdin)
    else
        local in=$1
    fi
    curl -G --data-urlencode "name=$in" "http://tiny/submit/url" | grep 'textarea name="url_box"' | perl -pe "s|.*url_box.*?>(.*)?<.*|\1|"
}

alias init_py='JAVA_HOME=/apollo/env/envImprovement/jdk1.7.0 JRE_HOME=/apollo/env/envImprovement/jdk1.7.0/jre JDK_HOME=/apollo/env/envImprovement/jdk1.7.0 /apollo/env/PythonVirtualEnvironment/bin/initialize.sh'
#alias python_all='/apollo/env/PythonVirtualEnvironment/bin/python_all'

alias boot='export APOLLO_ENVIRONMENT_ROOT="$(brazil-bootstrap)" && echo "Overrode APOLLO_ENVIRONMENT_ROOT=$APOLLO_ENVIRONMENT_ROOT"'

##########################################################
##                 Apollo Commands                      ##
##########################################################
 
 
cdl() { cd "/apollo/env/$1/var/output/logs" }
 
cde() { cd "/apollo/env/$1" }
 
cdb() { cd "/apollo/env/$1/bin" }
 
act() { sudo /apollo/bin/runCommand -a Activate -e $1 }
 
deact() { sudo /apollo/bin/runCommand -a Deactivate -e $1 }
 
react() { sudo /apollo/bin/runCommand -a Deactivate -e $1 && sudo /apollo/bin/runCommand -a Activate -e $1 }

envattach() { brazil ws --attachEnvironment --alias $1 }

cdw() { cd /workplace/$USER/$1 } #Quickly go to a workspace. Auto-complete of workspace names enabled!

envdetach() { brazil ws --detachEnvironment --alias $1 }

dateToMillis() { TZ=UTC date +%s%3N --date="$(echo "$@" | sed 's/T/ /')" }

alias bbp="brazil-build && brazil-build apollo-pkg"
alias b3p="/apollo/env/BrazilThirdPartyTool/bin/brazil-third-party-tool"
alias bre="brazil-runtime-execls/apollo/env/BrazilThirdPartyTool/bin/brazil-third-party-tool"
alias bre="brazil-runtime-exec"
alias octane="/apollo/env/OctaneBrazilTools/bin/brazil-octane"
alias pytest="/apollo/env/OctaneBrazilTools/Binils/brazil-octane"
alias pytest="brazil-test-exec python2.7 -m py.test"

alias s3put=/apollo/env/envImprovement/bin/s3put
