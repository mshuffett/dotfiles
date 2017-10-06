#!/usr/bin/env python3
import shelve

import click
import subprocess

from wunderpath import Path


def info(message):
    click.secho(message, fg='blue')


def rsync(server, project):
    command = ['/usr/bin/rsync', '-azP', '--delete', '--filter=:- .gitignore', str(project), '%s:~/ws' % server]
    info('Running command: %s' % ' '.join(command))
    return subprocess.check_call(command)


@click.command()
@click.option('--server', help='Set the default server to use')
@click.option('--dry-run', '-d', is_flag=True, help="Only print what we will do")
def up(server, dry_run):
    if dry_run:
        info('Dry Run')
    shelf_path_str = str(Path(__file__).real_path.parent.join('up.shelf'))
    with shelve.open(shelf_path_str) as shelf:
        if server:
            click.secho('Updating server to %s' % server, fg='blue')
            shelf['server'] = server
        else:
            project_root = Path().find_project_root()
            up_path = project_root.join('.up')
            if up_path.exists:
                info('Found .up file. Running %s.' % up_path)
                if not dry_run:
                    subprocess.check_call([up_path])
            else:
                try:
                    server = shelf['server']
                except KeyError:
                    click.secho('Server was not set!', fg='red')
                    return

                info("Couldn't find .up file. Running default action")
                info('Updating %s on server %s' % (project_root, server))
                if not dry_run:
                    rsync(server, project_root)


if __name__ == '__main__':
    up()
