fun! InlineDP()
    let [start_line, start_col] = getpos(".")[1:2]
    let n = 0
    let found = 0
    let root_path = '/rhel5pdi/workplace/shuffem/metrics/src/FMADatapathQueries/src/'
    while n <= line("$")
        let line = getline(n)
        let col = match(line, '(define')
        " Find line define is on
        if col != -1
        	let found = 1
        	break
        endif
        let n = n + 1
    endwhile

    if !found
    	return 0
    endif

    " Find closing paren
    let found = 0
    while n <= line("$")
        let line = getline(n)
        let col = match(line, ')')
        if col != -1
        	let found = 1
        	break
        endif
        let n = n + 1
    endwhile

    if !found
    	return 0
    endif

    "if start_line <= n
	"	let n = n + 1
	"else
	"	let n = start_line
	"endif
	let n = start_line

	" Find defs
    let found = 0
    let pattern = '\vfma::(\w+::)+\w+'
    let g:lines_to_add = []
    let g:file_paths = []
    while n <= line("$")
        let line = getline(n)
        let comment_pos = match(line, '//')
        if comment_pos != -1
        	let line = line[:comment_pos]
        endif
        while 1
        	let col = match(line, pattern)
        	if col == -1
        		break
        	endif
        	let call_str = matchstr(line, pattern)
        	let file_path = root_path . substitute(call_str, '::', '/', "g") . '.ion'
        	call add(g:file_paths, file_path)
        	let file_lines = readfile(file_path)
        	call extend(g:lines_to_add, file_lines)
        	let line = line[col + 1 + strlen(call_str):]
        endwhile
        let n = n + 1
    endwhile

    call append(0, g:lines_to_add)
endfunction

map <leader>z :call InlineDP()<CR>
